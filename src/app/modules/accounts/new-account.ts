import {AccountCategory, AccountType} from '../../services/backend/accounts.service';

export interface NewAccount {
  id: string;
  bookmark: boolean;
  name: string;
  siren: string;
  address: string;
  category: AccountCategory;
  type: AccountType;
  state: string;
  commercial: any;
}
