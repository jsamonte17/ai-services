import { Injectable } from '@nestjs/common';
import { Client, Operators } from 'intercom-client';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import { SearchConversationInterface } from './interface/search.conversations.interface';

const logger = new Logger('IntercomConversationsService');

@Injectable()
export class IntercomConversationsService {
  client = null;
  apiToken = this.configService.get('INTERCOM_TOKEN');
  uri = this.configService.get('INTERCOM_URI');

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

  searchConversationsService(
    payload: SearchConversationInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          startDate: start,
          endDate: end,
          page,
          perPage = 50,
          startingAfter,
        } = payload;

        const startDate = this.convertToUnix(new Date(start));
        const endDate = this.convertToUnix(new Date(end));

        const response = await this.client.conversations.search({
          data: {
            query: {
              operator: Operators.AND,
              value: [
                {
                  operator: Operators.OR,
                  value: [
                    {
                      field: 'updated_at',
                      operator: Operators.GREATER_THAN,
                      value: startDate,
                    },
                    {
                      field: 'updated_at',
                      operator: Operators.EQUALS,
                      value: startDate,
                    },
                  ],
                },
                {
                  operator: Operators.OR,
                  value: [
                    {
                      field: 'updated_at',
                      operator: Operators.LESS_THAN,
                      value: endDate,
                    },
                    {
                      field: 'updated_at',
                      operator: Operators.EQUALS,
                      value: endDate,
                    },
                  ],
                },
              ],
            },
            pagination: {
              page,
              per_page: perPage,
              starting_after: startingAfter,
            },
          },
        });

        resolve(response);
      } catch (err) {
        logger.error(
          `Error while searchConversationsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  private convertToUnix(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  getAllConversationsService(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://api.intercom.io/conversations`;

        const query = {
          per_page: payload.perPage,
          starting_after: payload.startingAfter,
        };

        const types = await firstValueFrom(
          this.httpService
            .get(uri, {
              headers: {
                Authorization: `Bearer ${this.apiToken}`,
              },
              params: query,
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
          `Error while getAllConversationsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  listConversationsService(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://api.intercom.io/conversations`;

        const query = {
          per_page: payload.perPage,
          starting_after: payload.startingAfter,
        };

        const types = await firstValueFrom(
          this.httpService
            .get(uri, {
              headers: {
                Authorization: `Bearer ${this.apiToken}`,
              },
              params: query,
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
          `Error while listConversationsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }
}
