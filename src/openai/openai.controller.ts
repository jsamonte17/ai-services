import {
  Post,
  Body,
  Controller,
  Logger,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiEmbeddingService } from './openai.embedding.service';
import {
  OpenaiVectoreStoreService,
  UploadEmbeddedFileVectorInterface,
} from './openai.vector.store.service';
import * as fs from 'fs';
import { OpenaiFileService } from './openai.file.service';
import { MessageCreateParams } from 'openai/resources/beta/threads/messages';
import {
  DeleteModelInterface,
  FineTuneModelInterface,
  ListModelsInterface,
} from './interface/model.interface';
import { OpenaiModelService } from './openai.model.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { Response } from 'express';

const logger = new Logger('OpenaiController');

interface AssistantInterface {
  conversationId: string;
  threadId?: string;
  body: MessageCreateParams;
}

@Controller('openai')
export class OpenaiController {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly openaiEmbeddingService: OpenaiEmbeddingService,
    private readonly openaiFileService: OpenaiFileService,
    private readonly openaiVectorStoreService: OpenaiVectoreStoreService,
    private readonly openaiModelService: OpenaiModelService,
  ) {}

  @Post('assistant')
  chat(@Body() body: AssistantInterface): Promise<any> {
    return this.openaiService.assistantService(body);
  }

  @Post('uploadEmbeddedVectorFile')
  uploadEmbeddedVectorFile(
    @Body() body: UploadEmbeddedFileVectorInterface,
  ): Promise<any> {
    return this.doUploadEmbeddedVectorFile(body);
  }

  @Post('getModels')
  getModels(@Body() body: ListModelsInterface): Promise<any> {
    return this.openaiModelService.listModelsService(body);
  }

  @Post('deleteFineTunedModel')
  deleteFineTunedModel(@Body() body: DeleteModelInterface): Promise<any> {
    return this.openaiModelService.deleteFineTunedModelService(body);
  }

  @Post('parsedJsonl')
  parsedJsonl(): Promise<any> {
    return this.openaiModelService.minifiedJsonlDataService(
      './data/openai/training.jsonl',
    );
  }

  @Post('finetuneModel')
  @UseInterceptors(FileInterceptor('file'))
  finetuneModel(
    @Body() body,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<any> {
    const payload: FineTuneModelInterface = {
      model: body.model,
      file,
      suffix: body.suffix,
    };

    return this.openaiModelService
      .finetuneModelService(payload)
      .catch((err) => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      });
  }

  doUploadEmbeddedVectorFile(
    payload: UploadEmbeddedFileVectorInterface,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`payload: ${JSON.stringify(payload)}`);

        const { path, vectorStoreId, purpose = 'assistants' } = payload;

        // get file content
        const filename = path.split('/').pop().split('.')[0];
        const content = await fs.promises.readFile(path, 'utf8');
        const contents = content.split('\n\n');

        // embed content
        const { filePath } =
          await this.openaiEmbeddingService.embedTextToFileService(
            filename,
            contents,
          );

        // upload file to openai
        const file = await this.openaiFileService.uploadFileService({
          path: filePath,
          purpose,
        });

        // attach file to vector store
        await this.openaiVectorStoreService.createVectorStoreFileService({
          vectorStoreId,
          body: { file_id: file.id },
        });

        resolve({ file });
      } catch (err) {
        reject(err);
      }
    });
  }

  // @NOTE For test api only
  // @Post('embedText')
  // embedText(@Body() body: any): Promise<any> {
  //   return this.openaiEmbeddingService.embedTextService(body.text);
  // }

  // @NOTE END OF For test api only

  @Post('getThread')
  getThread(@Body() body: any): Promise<any> {
    return this.openaiService.retrieveThreadService(body);
  }
}
