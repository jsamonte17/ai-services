import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  GetReportsInterface,
  ReportsInterface,
} from './interface/reports.interface';
import {
  GetSmsReportsInterface,
  GetSmsReportsResponseInterface,
} from './interface/reports.sms.interface';
import { ReportsSmsService } from './reports.sms.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsSmsService: ReportsSmsService,
  ) {}

  @Post()
  async index(@Body() body: GetReportsInterface): Promise<ReportsInterface> {
    await this.reportsService.totalsReportService(body);

    const reports: ReportsInterface = {
      clientsServed: this.reportsService.reports.clientsServed,
      sex: this.reportsService.reports.sex,
      age: this.reportsService.reports.age,
      city: this.reportsService.reports.city,
      employmentSector: this.reportsService.reports.employmentSector,
      satisfactionRate: this.reportsService.reports.satisfactionRate,
    };

    if (this.reportsService.pages) {
      reports.pages = this.reportsService.pages;
    }

    return reports;
  }

  @Post('sms')
  async sms(
    @Body() body: GetSmsReportsInterface,
  ): Promise<GetSmsReportsResponseInterface> {
    return await this.reportsSmsService.sms(body);
  }
}
