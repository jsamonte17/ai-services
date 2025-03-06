import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BusybeeService } from './busybee.service';
import { BusybeeSmsService } from './busybee.sms.service';
import { SendSmsInterface } from './interface/sms.list.interface';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { IntercomContactsService } from '@modules/intercom/intercom.contacts.service';
import * as _ from 'lodash';
import { BusybeeQueueSmsService } from './busybee.queueSms.service';
import { QueueSmsInterface } from './interface/sms.queue.interface';
import { AuthGuard } from '@modules/auth/auth.guard';

@Controller('busybee')
export class BusybeeController {
  constructor(
    private readonly busybeeService: BusybeeService,
    private readonly smsService: BusybeeSmsService,
    private readonly configService: ConfigService,
    private readonly intercomContactsService: IntercomContactsService,
    private readonly queueSmsService: BusybeeQueueSmsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('sendSms')
  sendSms(@Body() payload: any) {
    const data: SendSmsInterface = {
      senderId: this.configService.get('BUSYBEE_SENDER_ID'),
      message: payload.message,
      mobileNumbers: payload.mobileNumbers,
    };

    return this.smsService.sendSmsService(data);
  }

  @Get('getSenderIdList')
  getSenderIdList() {
    return this.busybeeService.getSenderIdList();
  }

  @UseGuards(AuthGuard)
  @Post('sendContactSms')
  async sendContactsSms(@Body() payload: any) {
    try {
      const contacts =
        await this.intercomContactsService.getAllSmsContactsService();

      const params: QueueSmsInterface = {
        message: payload.message,
        contacts,
      };
      return this.queueSmsService.queueSmsService(params);
    } catch (error) {
      throw error;
    }
  }
}
