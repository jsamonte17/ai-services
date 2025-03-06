import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { BusybeeSmsService } from './busybee.sms.service';
import { SendSmsInterface } from './interface/sms.list.interface';
import { SmsQueuedModel } from '@models/sms.queued.model';

const logger = new Logger('BusybeeSendSmsConsumer');

@Processor('queueBusybeeSendSms')
export class BusybeeQueueSmsConsumer extends WorkerHost {
  private senderId = this.configService.get('BUSYBEE_SENDER_ID');

  constructor(
    private readonly configService: ConfigService,
    private readonly busybeeSmsService: BusybeeSmsService,
  ) {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`sending job: ${job.id}: ${JSON.stringify(job.data)}`);

        const data = job.data;
        const { message, mobileNumbers } = data;

        if (!mobileNumbers.length || !message) {
          logger.error(`mobileNumbers is empty: ${JSON.stringify(data)}`);
          return;
        }

        // parsed mobileNumbers into string separated by comma
        const mobileNumbersString = mobileNumbers
          .map((num) => num.toString())
          .join(',');

        const params: SendSmsInterface = {
          senderId: this.senderId,
          message,
          mobileNumbers: mobileNumbersString,
        };

        logger.debug(`sending sms: ${JSON.stringify(params)}`);
        const sms = await this.busybeeSmsService.sendSmsService(params);
        const updated = await this.updateJobStatus({
          jobId: job.id,
          docs: sms,
          status: 'Success',
        });

        logger.debug(`sent sms: ${JSON.stringify(updated)}`);

        resolve(updated);
      } catch (error) {
        logger.error(
          `Error in queueBusybeeSendSms: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  updateJobStatus(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { jobId, docs, status } = payload;

        await SmsQueuedModel.update(
          { docs, status },
          { where: { jobId } },
        ).then(resolve);
      } catch (err) {
        logger.error(`Error while saving job: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
