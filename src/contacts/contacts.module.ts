import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { BullModule } from '@nestjs/bullmq';
import { ContactsSyncConsumer } from './contacts.sync.consumer';

@Module({
  imports: [BullModule.registerQueue({ name: 'queueContactsSyncConsumer' })],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsSyncConsumer],
})
export class ContactsModule {}
