import { IsString } from 'class-validator';

export class SendConversationMessageDTO {
  @IsString()
  senderPsid!: string;

  @IsString()
  body!: string;
}
