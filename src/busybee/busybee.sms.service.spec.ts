import { Test, TestingModule } from '@nestjs/testing';
import { BusybeeSmsService } from './busybee.sms.service';

describe('BusybeeSmsService', () => {
  let service: BusybeeSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusybeeSmsService],
    }).compile();

    service = module.get<BusybeeSmsService>(BusybeeSmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
