import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import * as _ from 'lodash';
import { Promise } from 'bluebird';
import { v4 as uuidv4 } from 'uuid';
import { SmsQueuedModel } from '@modules/models/sms.queued.model';
import { QueueSmsInterface } from './interface/sms.queue.interface';

const logger = new Logger('BusybeeSendSmsService');

@Injectable()
export class BusybeeQueueSmsService {
  constructor(
    @InjectQueue('queueBusybeeSendSms')
    private readonly queueBusybeeSendSms: Queue,
  ) {}

  queueSmsService(payload: QueueSmsInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const uuid = uuidv4();
        const { message, contacts } = payload;
        // chunks contacts by 100
        const chunks = [];
        for (let i = 0; i < contacts.length; i += 100) {
          chunks.push(contacts.slice(i, i + 100));
        }

        const result = await Promise.map(chunks, async (chunk) => {
          const queued = await this.queueBusybeeSendSms.add(
            'queueBusybeeSendSms',
            {
              message,
              mobileNumbers: chunk,
            },
          );

          // save job
          this.saveJob({
            uuid,
            jobId: queued.id,
            queueName: 'queueBusybeeSendSms',
            message,
            status: 'Inprogress',
          });

          return queued;
        });

        resolve(result);
      } catch (err) {
        logger.error(
          `Error while sendSmsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  private saveJob(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return SmsQueuedModel.create(payload).then(resolve);
      } catch (err) {
        logger.error(`Error while saving job: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    }) as Promise<any>;
  }
}
