import { Module } from '@nestjs/common';
import { IntercomService } from './intercom.service';
import { IntercomController } from './intercom.controller';
import { FacebookService } from '@modules/facebook/facebook.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { MarketingSubscriptionConsumer } from './marketing.subscription.consumer';
import { IntercomContactsService } from './intercom.contacts.service';
import { OpenaiCompletionService } from '@modules/openai/openai.completion.service';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'queueMarketingSubscription' }),
    BullModule.registerQueue({ name: 'queueFbPageReply' }),
  ],
  controllers: [IntercomController],
  providers: [
    IntercomService,
    FacebookService,
    MarketingSubscriptionConsumer,
    IntercomContactsService,
    OpenaiCompletionService,
  ],
})
export class IntercomModule {}
