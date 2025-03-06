export interface GetSmsReportsInterface {
  startDate: string;
  endDate: string;
}

export interface GetSmsReportsResponseInterface {
  totalSents: number;
  deliveryRate: string;
  rejected: number | 'Unknown';
}
