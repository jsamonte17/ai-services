import { IsNumber, IsString } from 'class-validator';
import { IsArray } from 'sequelize-typescript';

export class SexReportsDTO {
  @IsNumber()
  name!: string;

  @IsNumber()
  counts!: number;
}

export class CityReportsDTO {
  @IsString()
  name!: string;

  @IsNumber()
  counts!: number;
}

export class EmploymentSectorReportsDTO {
  @IsString()
  name!: string;

  @IsNumber()
  counts!: number;
}

export class ReportsDTO {
  @IsNumber()
  clientsServed?: number;

  @IsNumber()
  sex?: SexReportsDTO[];

  @IsNumber()
  age?: any;

  @IsNumber()
  city?: any[];

  @IsNumber()
  employmentSector?: EmploymentSectorReportsDTO[];

  satisfactionRate?: any[];
}
