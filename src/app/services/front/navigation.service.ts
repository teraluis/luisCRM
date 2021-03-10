import {Observable, Subject} from 'rxjs';
import {Injectable} from '@angular/core';


@Injectable()
export class NavigationService {

  private storageSub = new Subject<Navigation>();
  url = '';

  watch(): Observable<any> {
    return this.storageSub.asObservable();
  }

  set(navigation: Navigation) {
    this.url = navigation.url;
    this.storageSub.next(navigation);
  }

}

export interface Navigation {
  url: string;
  menu: MenuStep;
}

export enum MenuStep {
  DASHBOARD = "dashboard",
  ORDERS = "orders",
  INTERVENTIONS = "interventions",
  ACCOUNTS = "accounts",
  ACCOUNTS_PRO = "accounts_pro",
  ESTABLISHMENTS = "establishments",
  INDIVIDUALS = "individuals",
  ESTATES = "estates",
  DEVIS = "devis",
  MARCHES = "marches",
  OPERATIONS = "operations",
  FACTURATION = "facturation",
  ADMIN = "admin",
  EXPORT = "export",
  REFERENTIELS = 'referentiels',
  GROUPES = 'groupes',
  ACTIVITES = 'activites',
  AGENCES = 'agences',
  TECHNICAL_ACT = 'technical act',
  PRODUITS = 'products',
  EMPTY = ''
}
