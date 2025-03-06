import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { IntercomService } from '@modules/intercom/intercom.service';
import { FacebookService } from '@modules/facebook/facebook.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { OpenAiReplyConsumer } from './openai.reply.consumer';
import { OpenaiEmbeddingService } from './openai.embedding.service';
import { OpenaiFileService } from './openai.file.service';
import { OpenaiVectoreStoreService } from './openai.vector.store.service';
import { OpenaiModelService } from './openai.model.service';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'queueMarketingSubscription' }),
    BullModule.registerQueue({ name: 'queueOpenAiReply' }),
    BullModule.registerQueue({ name: 'queueFbPageReply' }),
  ],
  controllers: [OpenaiController],
  providers: [
    OpenaiService,
    OpenaiEmbeddingService,
    OpenaiFileService,
    OpenaiVectoreStoreService,
    OpenaiModelService,
    OpenAiReplyConsumer,
    IntercomService,
    FacebookService,
  ],
})
export class OpenaiModule {}
