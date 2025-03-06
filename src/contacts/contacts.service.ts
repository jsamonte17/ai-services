import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'intercom-client';
import * as Promise from 'bluebird';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ContactsSyncInterface } from './interface/contacts.sync.interface';

const logger = new Logger('ContactsService');

@Injectable()
export class ContactsService {
  private client = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('queueContactsSyncConsumer')
    private readonly queueContactsSyncConsumer: Queue,
  ) {
    this.client = new Client({
      tokenAuth: {
        token: this.configService.get('INTERCOM_TOKEN'),
      },
    });
  }

  syncContacts(payload: ContactsSyncInterface) {
    return new Promise(async (resolve, reject) => {
      try {
        const contacts: any = await this.listContacts(payload);

        await Promise.map(contacts.data, async (lead: any) => {
          const customAttributes = lead?.custom_attributes;

          const payload = {
            contactId: lead.id,
            userId: lead.external_id,
            fullName: lead?.name,
            email: lead?.email,
            contactNo: lead?.phone,
            senderPsid: customAttributes?.sender_psid,
            age: customAttributes?.Age,
            sex: customAttributes?.Sex,
            city: customAttributes?.City,
            employmentSector: customAttributes?.EmploymentSector,
            source: customAttributes?.Source,
          };

          logger.log(
            `Queued payload to queueContactsSynchConsumer: ${JSON.stringify(payload, null, 2)}`,
          );

          return this.queueContactsSyncConsumer.add(
            'queueContactsSyncConsumer',
            payload,
          );
        });

        resolve(contacts);
      } catch (err) {
        logger.error(
          `Error in ContactsService.syncContacts: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  listContacts(payload: ContactsSyncInterface) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.client.contacts.list(payload);

        resolve(response);
      } catch (err) {
        logger.error(`Error in listContacts: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
