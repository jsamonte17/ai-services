import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';
import { RequestOptions } from 'openai/core';
import {
  FileCreateParams,
  VectorStoreFile,
} from 'openai/resources/beta/vector-stores/files';

const logger = new Logger('OpenaiVectoreStoreService');

export interface CreateVectorFileInterface {
  vectorStoreId: string;
  body: FileCreateParams;
  options?: RequestOptions;
}

export interface UploadEmbeddedFileVectorInterface {
  path: string;
  vectorStoreId: string;
  purpose: 'assistants' | 'batch' | 'fine-tune' | 'vision';
}

@Injectable()
export class OpenaiVectoreStoreService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates a vector store file in the OpenAI service.
   *
   * @param {CreateVectorFileInterface} payload - The payload containing the vector store ID, { file_id: string }, and options.
   * @return {Promise<VectorStoreFile>} A promise that resolves to the created vector store file.
   */
  createVectorStoreFileService(
    payload: CreateVectorFileInterface,
  ): Promise<VectorStoreFile> {
    return new Promise(async (resolve, reject) => {
      const { vectorStoreId, body, options } = payload;
      logger.log(`Create vector store file: ${payload}`);
      try {
        const vsFile = await this.openai.beta.vectorStores.files.create(
          vectorStoreId,
          body,
          options,
        );

        logger.debug(`Create vector store file: ${JSON.stringify(vsFile)}`);

        resolve(vsFile);
      } catch (err) {
        logger.error(`createVectorStoreFileService: ${err}`);

        reject(err);
      }
    });
  }

  uploadEmbeddedFileVectorService(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const { vectorStoreId, body, options } = payload;
      logger.log(`Create vector store file: ${payload}`);
      try {
        const vsFile = await this.openai.beta.vectorStores.files.create(
          vectorStoreId,
          body,
          options,
        );

        logger.debug(`Create vector store file: ${JSON.stringify(vsFile)}`);

        resolve(vsFile);
      } catch (err) {
        logger.error(`createVectorStoreFileService: ${err}`);

        reject(err);
      }
    });
  }
}
