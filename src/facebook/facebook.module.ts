import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { HttpModule } from '@nestjs/axios';
import { IntercomService } from '@modules/intercom/intercom.service';
import { BullModule } from '@nestjs/bullmq';
import { OpenaiService } from '@modules/openai/openai.service';
import { FBPageReplyConsumer } from './page.reply.consumer';
import { OpenaiEmbeddingService } from '@modules/openai/openai.embedding.service';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'queueMarketingSubscription' }),
    BullModule.registerQueue({ name: 'queueOpenAiReply' }),
    BullModule.registerQueue({ name: 'queueFbPageReply' }),
  ],
  controllers: [FacebookController],
  providers: [
    FacebookService,
    IntercomService,
    OpenaiService,
    FBPageReplyConsumer,
    OpenaiEmbeddingService,
  ],
})
export class FacebookModule {}
