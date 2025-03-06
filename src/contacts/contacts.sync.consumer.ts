import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CreateLead } from '@modules/intercom/interface/create.lead.interface';
import { LeadsModel } from '@modules/models/leads.model';

const logger = new Logger('ContactsSyncConsumer');

@Processor('queueContactsSyncConsumer')
export class ContactsSyncConsumer extends WorkerHost {
  constructor() {
    super();
  }

  process(job: Job<any, any, string>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.log(
          `ContactsSyncConsumer.process job: ${job.id}: ${JSON.stringify(job.data)}`,
        );

        const data = job.data;

        this.saveLeadService(data);

        resolve(job.data);
      } catch (error) {
        logger.error(
          `Error in ContactsSyncConsumer.process: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  private saveLeadService(lead: CreateLead) {
    return new Promise(async (resolve, reject) => {
      try {
        return LeadsModel.findOrCreate({
          where: { contactId: lead.contactId },
          defaults: { ...lead },
        }).then(async ([leadInstance, isCreated]) => {
          if (!isCreated) {
            leadInstance.set({ ...lead });
            await leadInstance.save();
          }

          resolve(leadInstance);
        });
      } catch (err) {
        logger.error(
          `Error in ContactsSyncConsumer.saveLeadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }
}
