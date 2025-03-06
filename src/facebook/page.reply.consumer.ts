import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FacebookService } from './facebook.service';
import { PageReplyInterface } from './interface/fbpage.interface';

const logger = new Logger('FBPageReplyConsumer');

@Processor('queueFbPageReply')
export class FBPageReplyConsumer extends WorkerHost {
  constructor(private readonly facebookService: FacebookService) {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`process job: ${job.id}: ${JSON.stringify(job.data)}`);

        const data = job.data;
        const { recipientPageId, body } = data;

        // send ai reply to intercom
        const replyPayload: PageReplyInterface = {
          recipient: {
            id: recipientPageId,
          },
          message: {
            text: body.text,
          },
          messaging_type: 'RESPONSE',
        };
        await this.facebookService.pageReplyToMessageService(
          recipientPageId,
          replyPayload,
        );

        resolve(job.data);
      } catch (error) {
        logger.error(`Error in process: ${JSON.stringify(error, null, 2)}`);
        reject(error);
      }
    });
  }
}
