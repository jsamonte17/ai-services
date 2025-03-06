// create.lead.interface.ts
export interface PageReplyInterface {
  recipient: {
    id: string;
  };
  message: {
    text: string;
  };
  messaging_type?: string;
}
