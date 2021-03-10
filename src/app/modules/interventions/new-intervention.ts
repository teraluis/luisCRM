import {NewAccount} from '../accounts/new-account';
import {NewOrder} from '../orders/new-order';

export interface NewIntervention {
  id: string;
  name: string;
  account: NewAccount;
  prestations: string[];
  order: NewOrder;
  estate: { id: string, address: string };
  status: string;
  interventionDate: number;
}

export enum InterventionStatus {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  SETTLED = 'SETTLED',
  TO_SCHEDULE = 'TO_SCHEDULE',
  SCHEDULED = 'SCHEDULED',
  INCOMPLETE = 'INCOMPLETE',
  DONE = 'DONE'
}
