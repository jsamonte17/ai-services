import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.landingPageService();
  }

  @Get('privacy')
  privacyPage(): string {
    return this.appService.privaryPageService();
  }

  @Get('terms')
  termsPage(): string {
    return this.appService.termsPageService();
  }
}
