import { Test, TestingModule } from '@nestjs/testing';
import { BusybeeService } from './busybee.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('BusybeeService', () => {
  let service: BusybeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), HttpModule],
      providers: [BusybeeService],
    }).compile();

    service = module.get<BusybeeService>(BusybeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
