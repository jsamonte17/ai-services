import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';
import { FileObject } from 'openai/resources';
import * as fs from 'fs';

const logger = new Logger('OpenAIFileService');

export interface Uploadable {
  path: string;
  purpose: 'assistants' | 'batch' | 'fine-tune' | 'vision';
}

@Injectable()
export class OpenaiFileService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(private readonly configService: ConfigService) {}

  /**
   * Uploads a file to the OpenAI service.
   *
   * @param {Uploadable} payload - The payload containing the file path and purpose.
   * @return {Promise<FileObject>} A promise that resolves to the uploaded file object.
   */
  uploadFileService(payload: Uploadable): Promise<FileObject> {
    return new Promise(async (resolve, reject) => {
      const { path, purpose } = payload;
      logger.log(`Uploading file: ${path}`);
      try {
        const file = await this.openai.files.create({
          file: fs.createReadStream(path),
          purpose,
        });

        logger.debug(`Uploading response: ${JSON.stringify(file)}`);
        resolve(file);
      } catch (err) {
        logger.error(`Uploading error: ${err}`);

        reject(err);
      }
    });
  }
}
