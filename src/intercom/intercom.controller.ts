import { Body, Controller, Logger, Post } from '@nestjs/common';
import { IntercomService } from './intercom.service';
import { SyncLeadInterface } from './interface/lead.interface';
import { CreateLead } from './interface/create.lead.interface';
import { UpdateLead } from './interface/update.lead.interface';
import {
  ConversationAssignedToInterface,
  LiveAgentRepliedHookInterface,
} from './interface/conversation.interface';
import * as _ from 'lodash';

const logger = new Logger('IntercomController');

@Controller('intercom')
export class IntercomController {
  constructor(private readonly intercomService: IntercomService) {}

  @Post('webhooks')
  webhooks(@Body() body: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { topic, data } = body;
        const { item } = data;

        logger.log(`Intercom webhook: ${JSON.stringify(body, null, 2)}`);

        switch (topic) {
          case 'contact.lead.created':
          case 'contact.lead.updated':
            const customAttributes = data.item.custom_attributes;
            const leadPayload: SyncLeadInterface = {
              topic,
              lead: {
                contactId: data.item.id,
                userId: data.item.external_id,
                fullName: data.item.name,
                email: data.item.email,
                contactNo: data.item.phone,
                senderPsid: customAttributes.sender_psid,
                age: customAttributes.Age,
                sex: customAttributes.Sex,
                city: customAttributes.City,
                employmentSector: customAttributes.EmploymentSector,
                source: customAttributes.Source,
              },
            };
            this.syncLead(leadPayload).then(resolve);
            break;
          case 'contact.deleted':
            const result = await this.intercomService
              .deleteLeadService(data.item.id)
              .then((deleted) => (deleted ? true : false));

            resolve(result);
            break;
          case 'conversation.admin.replied':
            const conversationParts =
              item.conversation_parts.conversation_parts;
            const latestPart = conversationParts[0];

            const replyPayload: LiveAgentRepliedHookInterface = {
              conversationId: data.item.id,
              adminId: data.item.admin_assignee_id,
              messageText: latestPart.body,
            };
            this.intercomService
              .liveAgentRepliedToFb(replyPayload)
              .then(resolve);
            break;
          case 'conversation.admin.assigned':
            this.assignedTo(item).then(resolve);
            break;
          default:
            resolve('No action taken');
            break;
        }
      } catch (err) {
        logger.error(`Error in webhooks: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  @Post('subscribeToMarketingEmailsService')
  subscribeToMarketingEmailsService(@Body() body: any): Promise<any> {
    return this.intercomService.subscribeToMarketingEmailsService(body);
  }

  private syncLead(data: SyncLeadInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { topic, lead } = data;
        if (topic === 'contact.lead.created') {
          const createPayload: CreateLead = {
            contactId: lead.contactId,
            userId: lead.userId,
            fullName: lead.fullName,
            email: lead.email,
          };

          const result =
            await this.intercomService.saveLeadService(createPayload);
          resolve(result);
        } else if (topic === 'contact.lead.updated') {
          const updatePayload: UpdateLead = {
            contactId: lead.contactId,
            userId: lead.userId,
            fullName: lead.fullName,
            email: lead.email,
            contactNo: lead.contactNo,
            senderPsid: lead.senderPsid,
            age: lead.age,
            sex: lead.sex,
            city: lead.city,
            employmentSector: lead.employmentSector,
            source: lead.source,
          };

          const result =
            await this.intercomService.saveLeadService(updatePayload);

          resolve(result);
        }
      } catch (err) {
        logger.error(`Error in syncLead: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  @Post('getContact')
  getContact(@Body() body: any): Promise<any> {
    return this.intercomService.getContactService(body);
  }

  private assignedTo(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const conversationParts = data.conversation_parts.conversation_parts;
        const latestPart = conversationParts[0];
        const conversationId = data.id;
        const assignedTo = latestPart.assigned_to.id;

        const payload: ConversationAssignedToInterface = {
          conversationId,
          assignedTo,
        };

        await this.intercomService
          .conversationAssignedToService(payload)
          .then(resolve);
      } catch (err) {
        logger.error(`Error in syncLead: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
