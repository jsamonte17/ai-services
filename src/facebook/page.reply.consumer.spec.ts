import { Test, TestingModule } from '@nestjs/testing';
import { FBPageReplyConsumer } from './page.reply.consumer';
import { FacebookService } from './facebook.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('FBPageReplyConsumer', () => {
  let service: FBPageReplyConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), HttpModule],
      providers: [FBPageReplyConsumer, FacebookService],
    }).compile();

    service = module.get<FBPageReplyConsumer>(FBPageReplyConsumer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
