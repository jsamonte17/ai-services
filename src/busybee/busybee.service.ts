import { Injectable, Logger } from '@nestjs/common';
import { BusybeeResponseInterface } from './interface/sms.list.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';

const logger = new Logger('BusybeeService');

@Injectable()
export class BusybeeService {
  private url = this.configService.get('BUSYBEE_URL');
  private apiKey = this.configService.get('BUSYBEE_API_KEY');
  private clientId = this.configService.get('BUSYBEE_CLIENT_ID');

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  getSenderIdList(): Promise<BusybeeResponseInterface> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `${this.url}/api/v2/SenderId`;
        const params = {
          ApiKey: this.apiKey,
          ClientId: encodeURIComponent(this.clientId),
        };
        console.log({ params });
        const smsList = await firstValueFrom(
          this.httpService.get(uri, { params }).pipe(
            map((response) => response.data),
            catchError((err) => {
              throw err;
            }),
          ),
        );

        resolve(smsList);
      } catch (err) {
        logger.error(
          `Error while getSenderIdList: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }
}
