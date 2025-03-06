import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IntercomService } from '@modules/intercom/intercom.service';
import { SubscribeMarketingEmailInterface } from '@modules/intercom/interface/marketing.interface';

const logger = new Logger('MarketingSubscriptionConsumer');

@Processor('queueMarketingSubscription')
export class MarketingSubscriptionConsumer extends WorkerHost {
  constructor(private readonly intercomService: IntercomService) {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`process job: ${job.id}: ${JSON.stringify(job.data)}`);

        const data = job.data;
        const { contactId } = data;

        // send ai reply to intercom
        const subPayload: SubscribeMarketingEmailInterface = {
          contactId,
        };
        await this.intercomService.subscribeToMarketingEmailsService(
          subPayload,
        );

        resolve(job.data);
      } catch (error) {
        logger.error(`Error in process: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
    });
  }
}
