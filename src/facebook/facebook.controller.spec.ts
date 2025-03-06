import { Test, TestingModule } from '@nestjs/testing';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { IntercomService } from '@modules/intercom/intercom.service';
import { OpenaiService } from '@modules/openai/openai.service';
import { FBPageReplyConsumer } from './page.reply.consumer';
import { OpenaiEmbeddingService } from '@modules/openai/openai.embedding.service';
import { ConfigModule } from '@nestjs/config';

describe('FacebookController', () => {
  let controller: FacebookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
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
    }).compile();

    controller = module.get<FacebookController>(FacebookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
