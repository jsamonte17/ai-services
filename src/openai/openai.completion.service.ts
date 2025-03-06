import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';

const logger = new Logger('OpenAICompletionService');

@Injectable()
export class OpenaiCompletionService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(private readonly configService: ConfigService) {}

  parseMobileNumber(text: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            // @Note: don't use gpt-4o-mini, it can't return null if title not found
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Parse the mobile number based on the format '63XXXXXXXXXX' without the '+' sign. If no mobile number is found or invalid mobile number, then return null. If identified two different numbers, just use 1 number. Just return the actual number. If not a valid`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;

            resolve(content);
          });
      } catch (err) {
        logger.error(`parseMobileNumber: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
