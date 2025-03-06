import { Test, TestingModule } from '@nestjs/testing';
import { IntercomController } from './intercom.controller';
import { IntercomService } from './intercom.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('IntercomController', () => {
  let controller: IntercomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), HttpModule],
      controllers: [IntercomController],
      providers: [IntercomService],
    }).compile();

    controller = module.get<IntercomController>(IntercomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
