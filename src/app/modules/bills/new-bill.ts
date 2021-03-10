export class NewBill {
  id: string;
  order: {
    name: string,
    id: string,
    referenceNumber: string
  };
  name: string;
  creditNote: string;
  account: {
    id: string,
    name: string
  };
  market: string;
  address: string;
  status: string;
  exportDate: number;
}
