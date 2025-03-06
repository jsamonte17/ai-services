import { Injectable } from '@nestjs/common';
import {
  CreateLead,
  CreateIntercomLead,
  CreateInitialLeadInterface,
  FindOrCreateInitialLeadInterface,
} from './interface/create.lead.interface';
import {
  UpdateLead,
  UpdateIntercomLeadInterface,
} from './interface/update.lead.interface';
import { LeadsModel } from '@modules/models/leads.model';
import {
  Client,
  ConversationObject,
  MessageObject,
  MessageType,
} from 'intercom-client';
import { ConfigService } from '@nestjs/config';
import {
  AdminReplyToConversationInterface,
  ConversationAssignedToInterface,
  CreateConversationInterface,
  LiveAgentRepliedHookInterface,
  ReplyToConversationInterface,
  SendConversationMessageInterface,
} from './interface/conversation.interface';
import { ConversationsModel } from '@modules/models/conversations.model';
import { Logger } from '@nestjs/common';
import { PageReplyInterface } from '@modules/facebook/interface/fbpage.interface';
import { FacebookService } from '@modules/facebook/facebook.service';
import OpenAi from 'openai';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import * as _ from 'lodash';
import {
  ContactSubscribeMarketingEmailInterface,
  QueueSubscribeMarketingEmailInterface,
  SubscribeMarketingEmailInterface,
} from '@modules/intercom/interface/marketing.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const logger = new Logger('IntercomService');

@Injectable()
export class IntercomService {
  client = null;
  apiToken = this.configService.get('INTERCOM_TOKEN');

  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly facebookService: FacebookService,
    private readonly httpService: HttpService,
    @InjectQueue('queueMarketingSubscription')
    private readonly queueMarketingSubscription: Queue,
  ) {
    this.client = new Client({
      tokenAuth: {
        token: this.apiToken,
      },
    });

    this.client.useRequestOpts({
      headers: {
        'Intercom-Version': 2.11,
      },
    });
  }

  liveAgentRepliedToFb(payload: LiveAgentRepliedHookInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { conversationId, adminId, messageText } = payload;

        const cleanText = await this.htmlParserService(messageText);

        // get conversation
        const { senderPsid, recipientPageId } =
          await ConversationsModel.findOne({
            where: {
              conversationId,
            },
          }).then(async (convInstance) => {
            convInstance.set({ assignedTo: adminId });
            await convInstance.save();

            return convInstance.toJSON();
          });

        const maxLength = 2000;
        let toSend = [cleanText];

        if (cleanText.length > maxLength) {
          const chunks = [];
          for (let i = 0; i < cleanText.length; i += maxLength) {
            chunks.push(
              cleanText.substring(i, Math.min(i + maxLength, cleanText.length)),
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

        resolve(true);
      } catch (err) {
        logger.error(
          `Error in liveAgentRepliedToFb: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  saveLeadService(lead: UpdateLead | CreateLead) {
    return new Promise(async (resolve, reject) => {
      try {
        LeadsModel.findOrCreate({
          where: { contactId: lead.contactId },
          defaults: { ...lead },
        }).then(async ([leadInstance, isCreated]) => {
          if (!isCreated) {
            leadInstance.set({ ...lead });
            await leadInstance.save();
          }

          if (lead.email && lead.contactId) {
            // If email is present then subscribe to intercom newsletter
            const subPayload: SubscribeMarketingEmailInterface = {
              contactId: lead.contactId,
            };
            await this.subscribeToMarketingEmailsService(subPayload);
          }

          resolve(leadInstance);
        });
      } catch (err) {
        logger.error(
          `Error in saveLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  deleteLeadService(contactId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.log(`Deleting lead: ${contactId}`);
        const deleted = await LeadsModel.destroy({ where: { contactId } });

        // delete convesations
        await ConversationsModel.destroy({ where: { contactId } });

        resolve(deleted);
      } catch (err) {
        logger.error(
          `Error in deleteLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  getAdminListService() {
    return new Promise(async (resolve, reject) => {
      try {
        const admins = await this.client.admins.list();
        // console.dir({ admins }, { depth: null });
        resolve(admins);
      } catch (err) {
        logger.error(
          `Error while fetching admin list from intercom. Error: ${err}`,
        );
        reject(err);
      }
    });
  }

  /**
   * Function to find or create a lead service based on the provided payload. Trigger by facebook messenger message via Zapier webhook.
   *
   * @param {FindOrCreateInitialLeadInterface} payload - The payload containing lead information.
   * @return {Promise<any>} A promise resolving to the lead instance or an error.
   */
  findOrCreateFbLeadService(
    payload: FindOrCreateInitialLeadInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { senderPsid } = payload;
        const createPayload: CreateInitialLeadInterface = {
          fullName: payload.fullName,
          senderPsid,
          source: 'facebook',
        };

        return LeadsModel.findOrCreate({
          where: { senderPsid },
          paranoid: true,
          defaults: { ...createPayload },
        }).then(async ([leadInstance, isCreated]) => {
          const lead = leadInstance.toJSON();

          if (!isCreated) {
            resolve(lead);
          } else {
            // sync lead with intercom
            const createIntercomPayload: CreateIntercomLead = {
              name: lead.fullName,
            };
            const newLead = await this.createIntercomLeadService(
              createIntercomPayload,
            );
            const { id, external_id } = newLead;

            // save intercom contactId and userId into the database
            leadInstance.set({ contactId: id, userId: external_id });
            await leadInstance.save();

            resolve(leadInstance.toJSON());
          }
        });
      } catch (err) {
        logger.error(
          `findOrCreateFbLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  createIntercomLeadService(payload: CreateIntercomLead): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.client.contacts.createLead(payload).then(resolve);
      } catch (err) {
        logger.error(
          `createIntercomLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  updateIntercomLeadService(
    payload: UpdateIntercomLeadInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.client.contacts.update(payload).then(resolve);
      } catch (err) {
        logger.error(
          `updateIntercomLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  sendConversationMessage(
    payload: SendConversationMessageInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { recipientPageId, senderPsid, contactId, body, attachmentUrls } =
          payload;

        return ConversationsModel.findOrCreate({
          where: { contactId, senderPsid },
          defaults: { contactId, recipientPageId, senderPsid },
        }).then(async ([conversationInstance, isCreated]) => {
          const { conversationId } = conversationInstance.toJSON();

          if (isCreated || !conversationId) {
            const created = await this.createConversation({
              contactId,
              body,
              messageType: 'facebook' as MessageType,
              attachmentUrls,
            });
            // console.dir({ created }, { depth: null });
            conversationInstance.set({
              conversationId: created.conversation_id,
            });
            await conversationInstance.save();
          } else {
            const replyPayload: ReplyToConversationInterface = {
              id: conversationId,
              intercomUserId: contactId,
              body,
              attachmentUrls,
            };

            await this.replyToConversation(replyPayload);
          }

          resolve(conversationInstance.toJSON());
        });
      } catch (err) {
        logger.error(`Error while sending conversation message: ${err}`);
        reject(err);
      }
    });
  }

  createConversation(
    data: CreateConversationInterface,
  ): Promise<MessageObject> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`creating conversation: ${JSON.stringify(data)}`);
        const { contactId, body } = data;

        const response = await this.client.conversations.create({
          userId: contactId,
          body: body,
          attachmentUrls: data.attachmentUrls,
        });

        resolve(response);
      } catch (err) {
        logger.error(`Error while creating conversation: ${err}`);
        reject(err);
      }
    });
  }

  replyToConversation(
    data: ReplyToConversationInterface,
  ): Promise<ConversationObject> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`user replied to question: ${JSON.stringify(data)}`);
        const response = await this.client.conversations.replyByIdAsUser(data);

        resolve(response);
      } catch (err) {
        logger.error(
          `Error while user trying to reply to conversation: ${err}`,
        );
        reject(err);
      }
    });
  }

  adminReplyToConversation(
    data: AdminReplyToConversationInterface,
  ): Promise<ConversationObject> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`admin replied to question: ${JSON.stringify(data)}`);
        const response = await this.client.conversations.replyByIdAsAdmin(data);

        resolve(response);
      } catch (err) {
        logger.error(
          `Error while admin trying to reply to conversation ${data.id}: ${err}`,
        );
        reject(err);
      }
    });
  }

  htmlParserService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Your job is to return a parsed html string. You need to return it as a text with no html tags. It has to preserve new line and other syntax that will be understand by terminal.`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;

            resolve(content);
          });
      } catch (err) {
        logger.error(`htmlParser: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  queueSubscribeMarketingEmailsService(
    payload: QueueSubscribeMarketingEmailInterface,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug(
          `queueSubscribeMarketingEmailsService: ${JSON.stringify(payload)}`,
        );
        this.queueMarketingSubscription
          .add('queueMarketingSubscription', payload)
          .then(resolve)
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        logger.error(
          `Error in queueSubscribeMarketingEmailsService: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  subscribeToMarketingEmailsService(
    payload: SubscribeMarketingEmailInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(
          `subscribeToMarketingEmailsService: ${JSON.stringify(payload)}`,
        );

        // list subscription types
        const { data } = await this.client.subscriptions.listTypes();

        // subscribe to marketing emails
        const promises = _.map(data, (subscriptionType) => {
          const { id, consent_type, content_types } = subscriptionType;

          const hasEmail = _.some(content_types, (type) => type === 'email');

          if (hasEmail && consent_type === 'opt_in') {
            const subsPayload: ContactSubscribeMarketingEmailInterface = {
              contactId: payload.contactId,
              subscriptionId: id,
              consentType: consent_type,
            };

            return this.contactSubscribeToMarketingEmailsService(subsPayload);
          }
        }).filter(Boolean);

        return Promise.all(promises).then(resolve);
      } catch (err) {
        logger.error(
          `Error while subscribing to marketing emails: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  private contactSubscribeToMarketingEmailsService(
    payload: ContactSubscribeMarketingEmailInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://api.intercom.io/contacts/${payload.contactId}/subscriptions`;

        const body = {
          id: payload.subscriptionId,
          consent_type: payload.consentType,
        };

        const types = await firstValueFrom(
          this.httpService
            .post(uri, body, {
              headers: {
                Authorization: `Bearer ${this.apiToken}`,
              },
            })
            .pipe(
              map((response) => response.data),
              catchError((err) => {
                throw err;
              }),
            ),
        );

        resolve(types);
      } catch (err) {
        logger.error(
          `Error while subscribing to marketing emails: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  getContactService(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug(`getContact: ${JSON.stringify(payload)}`);
        this.client.contacts
          .find({ id: payload.id })
          .then(resolve)
          .catch((err) => {
            throw err;
          });
      } catch (error) {
        logger.error(`Error in getContact: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
    });
  }

  conversationAssignedToService(
    payload: ConversationAssignedToInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`conversationAssignedTo: ${JSON.stringify(payload)}`);
        const { conversationId, assignedTo } = payload;

        await ConversationsModel.findOne({
          where: {
            conversationId,
          },
        }).then(async (convInstance) => {
          if (!convInstance) {
            resolve;
            return null;
          }

          convInstance.set({ assignedTo });
          await convInstance.save();

          resolve(convInstance.toJSON());
        });
      } catch (error) {
        logger.error(
          `Error in conversationAssignedTo: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }
}
