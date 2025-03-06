export interface SearchConversationInterface {
  startDate: string;
  endDate: string;
  page: number;
  startingAfter?: string;
  perPage?: number;
}
