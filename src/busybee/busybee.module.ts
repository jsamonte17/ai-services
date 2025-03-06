import { Module } from '@nestjs/common';
import { BusybeeService } from './busybee.service';
import { BusybeeController } from './busybee.controller';
import { HttpModule } from '@nestjs/axios';
import { BusybeeSmsService } from './busybee.sms.service';
import { IntercomContactsService } from '@modules/intercom/intercom.contacts.service';
import { OpenaiCompletionService } from '@modules/openai/openai.completion.service';
import { BullModule } from '@nestjs/bullmq';
import { BusybeeQueueSmsConsumer } from './busybee.queueSms.consumer';
import { BusybeeQueueSmsService } from './busybee.queueSms.service';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'queueBusybeeSendSms' }),
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
})
export class BusybeeModule {}
