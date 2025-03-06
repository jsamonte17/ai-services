import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PageReplyInterface } from './interface/fbpage.interface';
import { catchError, firstValueFrom, map } from 'rxjs';

const logger = new Logger('FacebookService');

@Injectable()
export class FacebookService {
  private accessToken = this.configService.get<string>('FB_PAGE_ACCESS_TOKEN');

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  pageReplyToMessageService(pageId: string, payload: PageReplyInterface) {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://graph.facebook.com/v20.0/${pageId}/messages`;
        const maxLength = 2000;
        const text = payload.message.text;
        let limitText = text;

        if (text.length > maxLength) {
          limitText = text.substring(0, maxLength - 3) + '...';
          // Use the truncatedText variable as needed
        }
        const result = await firstValueFrom(
          this.httpService
            .post(
              uri,
              {
                ...payload,
                message: { text: limitText },
                access_token: this.accessToken,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            )
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
          `Error in pageReplyToMessageService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  getThreadOwner(psid: string, pageId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const uri = `https://graph.facebook.com/v20.0/${pageId}/thread_owner?recipient=${psid}&access_token=${this.accessToken}`;

        const result = await firstValueFrom(
          this.httpService.get(uri).pipe(
            map((response) => response.data),
            catchError((err) => {
              throw err;
            }),
          ),
        );

        resolve(result);
      } catch (err) {
        logger.error(
          `Error in getThreadOwner: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }
}
