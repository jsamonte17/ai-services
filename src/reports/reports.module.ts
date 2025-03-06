import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { OpenaiExtractionService } from '@modules/openai/openai.extraction.service';
import { IntercomConversationsService } from '@modules/intercom/intercom.conversations.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { SaveCityConsumer } from './reports.saveCity.consumer';
import { CacheModule } from '@nestjs/cache-manager';
import { ReportsSmsService } from './reports.sms.service';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'queueSaveCityConsumer' }),
    CacheModule.register(),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    OpenaiExtractionService,
    IntercomConversationsService,
    SaveCityConsumer,
    ReportsSmsService,
  ],
})
export class ReportsModule {}
