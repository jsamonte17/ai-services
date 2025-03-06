import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';

const logger = new Logger('OpenAI');

@Injectable()
export class OpenaiExtractionService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(private readonly configService: ConfigService) {}

  extractProfileDetailsService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            // @Note: don't use gpt-4o-mini, it can't return null if title not found
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `If the message has a "TITLE: PERSONAL DETAILS" as a signal, then extract profile details in json format. If no title is found, then return null. You need to rename the following: (full_name to fullName, age to age, gender to sex, phone_number to contactNo, current_city to city, employment_sector to employmentSector, email to email). If ever the age is given the exact value, change it to range instead due to privacy concerns (18-24, 25-34, 35-44, 45-54, 55-64, 65 and above, Did not specify).`,
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
            const jsonContent = content
              .replace('```json\n', '')
              .replace('```', '');

            const data = JSON.parse(jsonContent);

            resolve(data);
          });
      } catch (err) {
        logger.error(
          `extractProfileDetailsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  htmlParserService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Your job is to return a parsed html string. You need to return it as a text with no html tags. It has to preserve new line and other syntax that will be understand by terminal.`,
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
        logger.error(`htmlParser: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  openAiExtractCitys(city): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        logger.log(`openAiExtractCity: ${city}`);
        return this.openai.chat.completions
          .create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Your job is to return the city from address. You need to return it as a text with no html tags. Only return Unspecified if the city is null or unspecified. Take note that the same city has to be returned the same format and the format is the City, Province. It will be use for merging the same city for reporting. For example: 71 Mulawinan St. Lawang Bato Val. City is equivalent to Valenzuela City Metro Manila.; San Jose Del Monte City, Bulacan; Dasmariñas City, Cavite; Balanga, Bataan; Angeles City, Pampanga, Caloocan City, Metro Manila, Cavite City, Cavite, Paco, Manila`,
              },
              {
                role: 'user',
                content: city,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;

            resolve(content);
          });
      } catch (err) {
        logger.error(`openAiExtractCity: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
