export interface GetReportsInterface {
  startDate: string;
  endDate: string;
  page: number;
  startingAfter?: string;
  perPage?: number;
}

export interface ReportsInterface {
  pages?: any;
  clientsServed: number;
  sex: any[];
  age: any;
  city: any[];
  employmentSector: any[];
  satisfactionRate: any[];
}
