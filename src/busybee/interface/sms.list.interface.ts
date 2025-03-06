export interface BusybeeResponseInterface {
  ErrorCode: number;
  ErrorDescription: string;
  Data: any | any[];
}
export interface GetSMSListInterface {
  start: number;
  length: number;
  fromdate: string; // 'YYYY-MM-DD'
  enddate: string; // 'YYYY-MM-DD'
}

export interface SmsInterface {
  id: string;
}

export interface SendSmsInterface {
  senderId: string;
  message: string;
  mobileNumbers: string;
  isUnicode?: boolean;
  isFlash?: boolean;
  scheduleTime?: string; //yyyy-MM-dd HH:MM
  groupId?: string;
}

export interface SmsMessage {
  number: string;
  text: string;
}
