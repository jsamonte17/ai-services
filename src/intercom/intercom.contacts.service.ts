import { Injectable, Logger } from '@nestjs/common';
import { ListContactsInterface } from './interface/contact.interface';
import { catchError, firstValueFrom, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Client } from 'intercom-client';
import * as _ from 'lodash';
import { LeadsModel } from '@modules/models/leads.model';
import { Op } from 'sequelize';
import { OpenaiCompletionService } from '@modules/openai/openai.completion.service';
import * as Promise from 'bluebird';

const logger = new Logger('IntercomContactsService');

@Injectable()
export class IntercomContactsService {
  client = null;
  apiToken = this.configService.get('INTERCOM_TOKEN');

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly openaiCompletionService: OpenaiCompletionService,
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

  getIntercomContactsService(payload: ListContactsInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://api.intercom.io/contacts`;
        const { page, perPage, startingAfter } = payload;
        const params = { per_page: perPage };

        if (page) {
          params['page'] = page;
        }
        if (startingAfter) {
          params['starting_after'] = startingAfter;
        }

        const result = await firstValueFrom(
          this.httpService
            .get(uri, {
              headers: {
                Authorization: `Bearer ${this.apiToken}`,
              },
              params,
            })
            .pipe(
              map((response) => response.data),
              catchError((err) => {
                throw err;
              }),
            ),
        );

        resolve(result);
      } catch (err) {
        logger.error(
          `Error getContactsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  getAllSmsContactsService(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const contacts = await this.getAllContactsService();

        resolve(contacts);
      } catch (err) {
        logger.error(
          `Error getAllContactsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  getAllContactsService(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return LeadsModel.findAll({
          where: {
            contactNo: {
              [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
            },
          },
        }).then(async (leadsInstances) => {
          const contacts = await Promise.map(leadsInstances, async (lead) => {
            const parsed = lead.toJSON();
            const contactNo = parsed.contactNo;

            // const contactNo =
            //   await this.openaiCompletionService.parseMobileNumber(
            //     parsed.contactNo,
            //   );

            const mobileNumber = contactNo
              .replace(/^(\+63|0)/, '63')
              .replace(/\s+/g, '')
              .replace(/-/g, '');
            const isValidPhoneNumber = /^\d{12}$/.test(mobileNumber);
            if (!isValidPhoneNumber) return null;

            return mobileNumber;
          });

          const filtered = _.compact(contacts);

          resolve(filtered);
        });
      } catch (err) {
        logger.error(
          `Error getAllContactsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }
}
