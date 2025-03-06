export interface QueueSubscribeMarketingEmailInterface {
  contactId: string;
}
export interface SubscribeMarketingEmailInterface {
  contactId: string;
}

export interface ContactSubscribeMarketingEmailInterface {
  contactId: string;
  subscriptionId: string;
  consentType: 'opt_in' | 'opt_out';
}
