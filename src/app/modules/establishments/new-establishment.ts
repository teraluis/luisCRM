export class NewEstablishment {
  id: string;
  name: string;
  siret: string;
  address: string;
  description: string;
  activity: string;
  account: { id: string, status: string, category: string };
}
