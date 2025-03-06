import { Test, TestingModule } from '@nestjs/testing';
import { IntercomContactsService } from './intercom.contacts.service';

describe('IntercomContactsService', () => {
  let service: IntercomContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntercomContactsService],
    }).compile();

    service = module.get<IntercomContactsService>(IntercomContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
