import { Inject, Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  GetSmsReportsInterface,
  GetSmsReportsResponseInterface,
} from './interface/reports.sms.interface';
import { SmsQueuedModel } from '@models/sms.queued.model';
import { Op } from 'sequelize';
import { ReportsSmsDTO } from './dto/reports.sms.dto';

const logger = new Logger('ReportsSmsService');

@Injectable()
export class ReportsSmsService {
  public reports: ReportsSmsDTO;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.reports = new ReportsSmsDTO();
    this.reports.deliveryRate = 'Unknown';
    this.reports.rejected = 'Unknown';
  }

  sms(post: GetSmsReportsInterface): Promise<GetSmsReportsResponseInterface> {
    return new Promise(async (resolve, reject) => {
      try {
        // get sms sents
        const smsSents = await this.smsSents(post);

        // get contacts served
        let totalSents = 0;
        const contactsServed = await this.paraseContactsServed(smsSents);

        _.map(contactsServed, (c) => {
          const total = c.length;
          totalSents += total;

          return total;
        });

        this.reports.totalSents = totalSents;
        const result: GetSmsReportsResponseInterface = this.reports as any;

        resolve(result);
      } catch (error) {
        logger.error(
          `Error in ReportsSmsService.sms: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  private smsSents(post: GetSmsReportsInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { startDate, endDate } = post;

        // get sms list
        const smsInstances = await SmsQueuedModel.findAll({
          where: {
            createdAt: {
              [Op.and]: [
                {
                  [Op.gte]: startDate,
                },
                {
                  [Op.lte]: endDate,
                },
              ],
            },
          },
        });

        const smsSents = _.map(smsInstances, (smsInstance) => {
          return smsInstance.get({ plain: true });
        });

        resolve(smsSents);
      } catch (error) {
        logger.error(
          `Error in ReportsSmsService.sms: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  private paraseContactsServed(smsSents: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const contactsServed = _.chain(smsSents)
          .map((sms) => {
            const docs = sms.docs;
            const sentContacts = docs.Data;

            if (!sentContacts.length) {
              return null;
            }

            // get MobileNumber for each sent
            const mobileNumbers = _.chain(sentContacts)
              .filter((sent) => sent.MessageErrorCode === 0)
              .map((sent) => sent.MobileNumber)
              .uniq()
              .value();

            return mobileNumbers;
          })
          .value();

        resolve(contactsServed);
      } catch (error) {
        logger.error(
          `Error in ReportsSmsService.paraseContactsServed: ${JSON.stringify(
            error,
            null,
            2,
          )}`,
        );
        reject(error);
      }
    });
  }
}
