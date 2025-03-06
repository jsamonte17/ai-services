import { IsNumber, IsString } from 'class-validator';

export class ReportsSmsDTO {
  @IsNumber()
  totalSents: number;

  @IsString()
  deliveryRate?: string;

  @IsNumber()
  rejected?: number | 'Unknown';
}
