import { Body, Controller, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsSyncInterface } from './interface/contacts.sync.interface';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('sync')
  syncContacts(@Body() body: ContactsSyncInterface) {
    return this.contactsService.syncContacts(body);
  }
}
