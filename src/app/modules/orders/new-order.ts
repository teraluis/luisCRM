import {NewEstablishment} from "../establishments/new-establishment";

export class NewOrder {
  id: string;
  name: string;
  market: any;
  establishment: NewEstablishment;
  purchaser: any;
  commercial: string;
  address: string;
  referenceNumber: string;
  receive: number;
  delivery: number;
  visit: number;
  assessment: number;
  nbEstate: number;
  estateRefs: string[];
  prestations: any;
  workdescription: string;
}
