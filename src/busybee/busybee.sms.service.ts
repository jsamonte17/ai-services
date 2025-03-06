import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import {
  BusybeeResponseInterface,
  GetSMSListInterface,
  SendSmsInterface,
  SmsInterface,
} from './interface/sms.list.interface';

const logger = new Logger('BusybeeSmsService');

@Injectable()
export class BusybeeSmsService {
  private url = this.configService.get('BUSYBEE_URL');
  private apiKey = this.configService.get('BUSYBEE_API_KEY');
  private clientId = this.configService.get('BUSYBEE_CLIENT_ID');

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private smsListService(
    payload: GetSMSListInterface,
  ): Promise<BusybeeResponseInterface> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `${this.url}/api/v2/SMS`;
        const { start = 0, length = 100, ...etc } = payload;
        const params = {
          ApiKey: encodeURIComponent(this.apiKey),
          ClientId: encodeURIComponent(this.clientId),
          start,
          length,
          ...etc,
        };

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
          `Error while getting sms list: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  private getSmsStatusService(
    payload: SmsInterface,
  ): Promise<BusybeeResponseInterface> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `${this.url}/api/v2/MessageStatus`;
        const { id } = payload;
        const params = {
          ApiKey: encodeURIComponent(this.apiKey),
          ClientId: encodeURIComponent(this.clientId),
          MessageId: id,
        };

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
          `Error while getting sms status: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }

  sendSmsService(payload: SendSmsInterface): Promise<BusybeeResponseInterface> {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `${this.url}/api/v2/SendSMS`;
        const {
          senderId,
          message,
          mobileNumbers,
          isUnicode = false,
          isFlash = false,
          ...etc
        } = payload;
        const data = {
          ApiKey: this.apiKey,
          ClientId: this.clientId,
          SenderId: senderId,
          Message: message,
          MobileNumbers: mobileNumbers,
          Is_Unicode: isUnicode,
          Is_Flash: isFlash,
          ...etc,
        };

        const smsList = await firstValueFrom(
          this.httpService.post(uri, data).pipe(
            map((response) => response.data),
            catchError((err) => {
              throw err;
            }),
          ),
        );

        resolve(smsList);
      } catch (err) {
        logger.error(
          `Error while sending sms: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    }) as Promise<any>;
  }
}
