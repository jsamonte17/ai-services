import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';
import {
  DeleteModelInterface,
  FineTuneModelInterface,
  ListModelsInterface,
} from './interface/model.interface';
import * as _ from 'lodash';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';
import { FilesModel } from '@modules/models/files.model';

const logger = new Logger('OpenAI');

@Injectable()
export class OpenaiModelService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  listModelsService(payload: ListModelsInterface): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const { apiKey } = payload;
        const openai = apiKey ? new OpenAi({ apiKey }) : this.openai;

        openai.models
          .list()
          .then(resolve)
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        logger.error(
          `Error in listModelsService: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  deleteFineTunedModelService(payload: DeleteModelInterface): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const { modelId, apiKey } = payload;
        const openai = apiKey ? new OpenAi({ apiKey }) : this.openai;

        openai.models
          .del(modelId)
          .then(resolve)
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        logger.error(
          `Error in deleteFineTunedModelService: ${JSON.stringify(error, null, 2)}`,
        );

        reject(error);
      }
    });
  }

  minifiedJsonlDataService(jsonlFile: string, dest?: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const data = fs.readFileSync(jsonlFile, 'utf8');
        const marked = data.replace(/\n{\n/g, '\n||{\n');
        const split = marked.split('||');

        if (!dest) dest = './data/openai/parsed.jsonl';

        // clear file before writing
        await fs.promises.writeFile(dest, '').then(() => {
          _.map(split, (item) => {
            const parsed = JSON.parse(item);

            fs.appendFile(dest, JSON.stringify(parsed) + '\n', (err) => {
              if (err) {
                throw err;
              }
            });
            return parsed;
          });

          resolve(dest);
        });
      } catch (error) {
        logger.error(
          `Error in minifiedJsonListDataService: ${JSON.stringify(error, null, 2)}`,
        );

        reject(error);
      }
    });
  }

  finetuneModelService(payload: FineTuneModelInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { model, file, suffix } = payload;

        // get file name
        const originalname = file.originalname;
        const filename = originalname.split('.')[0] + '-' + Date.now();
        const type = file.mimetype;

        const fileInstance = await FilesModel.findOne({
          where: { name: originalname },
        });

        if (fileInstance) {
          throw 'File already exists';
        }

        // upload file into ./data/openai/uploads
        const dest = `./data/openai/uploads`;
        const filePath = `${dest}/${filename}.jsonl`;
        await fs.promises.writeFile(filePath, file.buffer).catch((err) => {
          throw err;
        });

        const minFilePath = await this.minifiedJsonlDataService(
          filePath,
          `${dest}/${filename}.min.jsonl`,
        );

        // delete original file
        fs.unlinkSync(filePath);

        // upload file to openai
        const trainingFile = await this.openai.files.create({
          file: fs.createReadStream(minFilePath),
          purpose: 'fine-tune',
        });

        // create file to database
        const document = { trainingFile };
        FilesModel.create({
          category: 'OPENAI',
          type,
          name: originalname,
          path: minFilePath,
          size: file.size,
          document,
        });

        // finetune model
        const fineTune = await this.openai.fineTuning.jobs.create({
          training_file: trainingFile.id,
          model,
          suffix,
        });

        resolve(fineTune);
      } catch (error) {
        logger.error(
          `Error in finetuneModelService: ${JSON.stringify(error, null, 2)}`,
        );

        reject(error);
      }
    });
  }
}
