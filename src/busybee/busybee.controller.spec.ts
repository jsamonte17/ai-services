import { Test, TestingModule } from '@nestjs/testing';
import { BusybeeController } from './busybee.controller';
import { BusybeeService } from './busybee.service';
import { BusybeeSmsService } from './busybee.sms.service';
import { IntercomContactsService } from '@modules/intercom/intercom.contacts.service';
import { BusybeeQueueSmsService } from './busybee.queueSms.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { OpenaiCompletionService } from '@modules/openai/openai.completion.service';
import { BusybeeQueueSmsConsumer } from './busybee.queueSms.consumer';
import { AuthModule } from '@modules/auth/auth.module';

describe('BusybeeController', () => {
  let controller: BusybeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        HttpModule,
        BullModule.registerQueue({ name: 'queueBusybeeSendSms' }),
        AuthModule,
      ],
      controllers: [BusybeeController],
      providers: [
        BusybeeService,
        BusybeeSmsService,
        IntercomContactsService,
        OpenaiCompletionService,
        BusybeeQueueSmsConsumer,
        BusybeeQueueSmsService,
      ],
    }).compile();

    controller = module.get<BusybeeController>(BusybeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
