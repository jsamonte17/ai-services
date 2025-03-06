// create.lead.interface.ts
export interface ReceiveFbMessage {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  message: {
    mid: string;
    text: string;
    attachments: any[];
    commands: any[];
  };
}
