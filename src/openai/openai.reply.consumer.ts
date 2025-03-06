import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { ReplyToConversationMessageType } from 'intercom-client';
import { FacebookService } from '@modules/facebook/facebook.service';
import { PageReplyInterface } from '@modules/facebook/interface/fbpage.interface';
import { IntercomService } from '@modules/intercom/intercom.service';
import { AdminReplyToConversationInterface } from '@modules/intercom/interface/conversation.interface';
import { QueueSubscribeMarketingEmailInterface } from '@modules/intercom/interface/marketing.interface';
import { LeadsModel } from '@modules/models/leads.model';
import { AssistantInterface } from '@modules/openai/interface/assistant.interface';
import { SyncAiLeadInterface } from '@modules/openai/interface/syncLead.interface';
import { OpenaiService } from '@modules/openai/openai.service';

const logger = new Logger('OpenAiReplyConsumer');

@Processor('queueOpenAiReply')
export class OpenAiReplyConsumer extends WorkerHost {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly configService: ConfigService,
    private readonly facebookService: FacebookService,
    private readonly intercomService: IntercomService,
  ) {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`process job: ${job.id}: ${JSON.stringify(job.data)}`);

        const data = job.data;
        const { conversationId, threadId, body, senderPsid, recipientPageId } =
          data;

        // get reply from openai
        const aiPayload: AssistantInterface = {
          conversationId,
          threadId,
          body,
        };
        logger.debug(`aiPayload: ${JSON.stringify(aiPayload)}`);
        const aiReply = await this.openaiService.assistantService(aiPayload);
        logger.debug(`aiReply: ${aiReply}`);
        const maxLength = 2000;
        let toSend = [aiReply];

        if (aiReply.length > maxLength) {
          const chunks = [];
          for (let i = 0; i < aiReply.length; i += maxLength) {
            chunks.push(
              aiReply.substring(i, Math.min(i + maxLength, aiReply.length)),
            );
          }
          toSend = chunks;
        }

        // send reply to fb messenger
        for (const reply of toSend) {
          const fbPayload: PageReplyInterface = {
            recipient: {
              id: senderPsid,
            },
            messaging_type: 'RESPONSE',
            message: {
              text: reply,
            },
          };

          await this.facebookService.pageReplyToMessageService(
            recipientPageId,
            fbPayload,
          );
        }

        // send ai reply to intercom
        const aiReplyPayload: AdminReplyToConversationInterface = {
          id: conversationId,
          adminId: this.configService.get<string>('INTERCOM_AI_USER_ID'),
          messageType: ReplyToConversationMessageType.COMMENT,
          body: aiReply,
        };
        await this.intercomService.adminReplyToConversation(aiReplyPayload);

        // extract and save details from aiReply if applicable
        await this.syncLead(aiReply, senderPsid);

        resolve(job.data);
      } catch (error) {
        logger.error(`Error in process: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
    });
  }

  private syncLead(aiReply: string, senderPsid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const isCompleted = await LeadsModel.findOne({
          where: {
            senderPsid,
          },
        }).then((leadInstance) => {
          const lead = leadInstance.toJSON();

          if (
            lead.fullName &&
            lead.email &&
            lead.contactNo &&
            lead.age &&
            lead.city &&
            lead.sex &&
            lead.employmentSector
          ) {
            return true;
          } else {
            return false;
          }
        });

        if (isCompleted) {
          resolve(false);
          return;
        }

        // check for visitor if given profile details then sync to database and intercom
        const profile =
          await this.openaiService.extractProfileDetailsService(aiReply);

        if (profile) {
          const profilePayload: SyncAiLeadInterface = {
            senderPsid,
            fullName: profile.fullName,
            email: profile.email,
            contactNo: profile.contactNo,
            age: profile.age,
            sex: profile.sex,
            city: profile.city,
            employmentSector: profile.employmentSector,
            source: 'facebook',
          };
          const lead =
            await this.openaiService.syncAiLeadService(profilePayload);

          logger.debug(
            `profile has an email subscribe: ${lead.contactId} ${profile.email}`,
          );

          if (profile.email) {
            // If email is present then subscribe to intercom newsletter
            const subPayload: QueueSubscribeMarketingEmailInterface = {
              contactId: lead.contactId,
            };

            this.intercomService.queueSubscribeMarketingEmailsService(
              subPayload,
            );
          }
        }
        resolve(true);
      } catch (error) {
        logger.error(
          `Error in processDetails: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }
}
