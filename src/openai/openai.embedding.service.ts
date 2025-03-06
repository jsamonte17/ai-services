import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import OpenAi from 'openai';
import * as path from 'path';

const logger = new Logger('OpenAIEmbeddingService');

@Injectable()
export class OpenaiEmbeddingService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(private readonly configService: ConfigService) {}

  embedTextService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      logger.log(`embedTextService: ${text}`);
      try {
        const embedding = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: [text],
          encoding_format: 'float',
          dimensions: 1024,
        });

        logger.debug(
          `embedTextService response: ${JSON.stringify({ model: embedding.model, usage: embedding.usage })}`,
        );

        resolve(embedding);
      } catch (err) {
        logger.error(`embedTextService error: ${err}`);

        reject(err);
      }
    });
  }

  embedTextToFileService(
    filename: string,
    text: string | string[],
    dest?: string,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      logger.log(`embedTextToFileService: ${text}`);
      try {
        const embedding = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: 'float',
          dimensions: 1024,
        });

        if (!dest) {
          dest = './data/vectorStore/embeddings';
        }

        // save embedding to a file
        let fileName = `embedding_${new Date().toUTCString()}.json`;

        if (filename) {
          fileName = `${filename}_${new Date().toISOString()}.json`;
        }

        const filePath = path.join(dest, fileName);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(embedding.data));

        logger.debug(
          `embedTextToFileService response: ${JSON.stringify({ model: embedding.model, usage: embedding.usage })}`,
        );

        resolve({
          fileName,
          filePath,
          embedding: { model: embedding.model, usage: embedding.usage },
        });
      } catch (err) {
        logger.error(`embedTextToFileService error: ${err}`);

        reject(err);
      }
    });
  }
}
