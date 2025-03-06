import { Test, TestingModule } from '@nestjs/testing';
import { BusybeeQueueSmsConsumer } from './busybee.queueSms.consumer';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BusybeeSmsService } from './busybee.sms.service';

describe('queueBusybeeSendSms', () => {
  let service: BusybeeQueueSmsConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), HttpModule],
      providers: [BusybeeQueueSmsConsumer, BusybeeSmsService],
    }).compile();

    service = module.get<BusybeeQueueSmsConsumer>(BusybeeQueueSmsConsumer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
