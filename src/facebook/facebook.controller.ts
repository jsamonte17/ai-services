import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { ConfigService } from '@nestjs/config';
import { PageReplyInterface } from './interface/fbpage.interface';
import { ReceiveFbMessage } from './interface/receive.fbmessage.interface';
import { IntercomService } from '@modules/intercom/intercom.service';
import { FindOrCreateInitialLeadInterface } from '@modules/intercom/interface/create.lead.interface';
import { SendConversationMessageInterface } from '@modules/intercom/interface/conversation.interface';
import * as _ from 'lodash';
import { QueueAiReplyInterface } from '@modules/openai/interface/assistant.interface';
import { OpenaiService } from '@modules/openai/openai.service';

const logger = new Logger('FacebookService');

@Controller('facebook')
export class FacebookController {
  private adminAiId = this.configService.get<string>('INTERCOM_AI_USER_ID');

  constructor(
    private readonly facebookService: FacebookService,
    private readonly configService: ConfigService,
    private readonly intercomService: IntercomService,
    private readonly openaiService: OpenaiService,
  ) {}

  @Get('webhooks')
  async webhookSetup(@Query() query: any): Promise<any> {
    const FB_VERIFY_TOKEN = this.configService.get('FB_VERIFY_TOKEN');
    console.log({ FB_VERIFY_TOKEN });
    if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === FB_VERIFY_TOKEN
    ) {
      return query['hub.challenge'];
    } else {
      throw 'Invalid request';
    }
  }

  @Post('webhooks')
  webhooks(@Body() body: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { object, entry } = body;
        // console.dir({ body }, { depth: null });
        logger.debug(
          `Received message from facebook webhook app: ${JSON.stringify(body)}`,
        );

        switch (object) {
          case 'page':
            if (
              entry?.[0]?.messaging?.length > 0 &&
              entry?.[0]?.messaging?.[0]?.message
            ) {
              const messagePayload: ReceiveFbMessage = {
                sender: entry?.[0]?.messaging?.[0]?.sender,
                recipient: entry?.[0]?.messaging?.[0]?.recipient,
                message: entry?.[0]?.messaging?.[0]?.message,
              };
              this.sendMessageFromFacebookApp(messagePayload);
            } else if (
              entry?.[0]?.standby?.length > 0 &&
              entry?.[0]?.standby?.[0]?.message
            ) {
              const messagePayload: ReceiveFbMessage = {
                sender: entry?.[0]?.standby?.[0]?.sender,
                recipient: entry?.[0]?.standby?.[0]?.recipient,
                message: entry?.[0]?.standby?.[0]?.message,
              };
              this.sendMessageFromFacebookApp(messagePayload);
            }
            break;
          default:
            resolve('No action taken webhooks');
            break;
        }
        resolve(body);
      } catch (err) {
        logger.error(
          `Error in webhookController: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  @Post('pageReplyToMessage')
  pageReplyToMessage(@Body() body: any): Promise<any> {
    // console.dir({ body }, { depth: null });
    const replyPayload: PageReplyInterface = {
      recipient: {
        id: body.recipient.id,
      },
      message: {
        text: body.message.text,
      },
      messaging_type: 'RESPONSE',
    };
    // console.dir({ replyPayload }, { depth: null });
    return this.facebookService.pageReplyToMessageService(
      body.recepientPageId,
      replyPayload,
    );
  }

  private sendMessageFromFacebookApp(payload: ReceiveFbMessage) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(
          `Processing message from facebook webhook app: ${JSON.stringify(payload)}`,
        );

        // get sender lead details
        const leadPayload: FindOrCreateInitialLeadInterface = {
          senderPsid: payload.sender.id,
        };
        const lead =
          await this.intercomService.findOrCreateFbLeadService(leadPayload);
        logger.debug(`Lead found or created: ${JSON.stringify(lead)}`);

        // send visitor's message to intercom
        const attachmentUrls = _.map(
          payload.message.attachments,
          'payload.url',
        );

        const conversationPayload: SendConversationMessageInterface = {
          recipientPageId: payload.recipient.id,
          senderPsid: payload.sender.id,
          contactId: lead.contactId,
          body: payload.message.text,
          attachmentUrls,
        };

        const conversation =
          await this.intercomService.sendConversationMessage(
            conversationPayload,
          );

        // check the facebook appId first if match with our appId for the AI
        const appId = await this.facebookService
          .getThreadOwner(payload.sender.id, payload.recipient.id)
          .then(({ data }) => {
            return data?.[0]?.thread_owner?.app_id || null;
          });

        // Check first if conversation is assigned to AI/null to proceed
        const assignedTo = _.get(conversation, 'assignedTo', null);
        if (
          (assignedTo !== this.adminAiId && assignedTo !== null) ||
          appId !== this.configService.get('FB_PAGE_APP_ID')
        ) {
          logger.debug(
            `Conversation not assigned to AI or appId not matched: ${JSON.stringify(
              {
                assignedTo,
                appId,
              },
              null,
              2,
            )}`,
          );
          return;
        }

        logger.debug(
          `Conversation assigned to AI: ${JSON.stringify({ appId, assignedTo }, null, 2)}`,
        );

        // Queue message to be process and replied by AI
        const queuePayload: QueueAiReplyInterface = {
          conversationId: conversation.conversationId,
          threadId: conversation.threadId,
          body: {
            role: 'user',
            content: payload.message.text || [
              { image_url: { url: attachmentUrls[0] }, type: 'image_url' },
            ],
          },
          senderPsid: lead.senderPsid,
          recipientPageId: payload.recipient.id,
        };
        const queued =
          await this.openaiService.queueOpenAiReplyService(queuePayload);

        resolve(queued);

        // resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }
}
