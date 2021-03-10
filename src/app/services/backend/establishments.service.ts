import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {People, PeopleWithRole} from './people.service';
import {Address, AddressWithRole} from './addresses.service';
import {Account, OverviewFilter, OverviewSort} from "./accounts.service";
import {IActivity} from "./activity.service";
import {IndexableEstablishment} from "./search.service";
import {IUser} from "./users.service";
import {AbstractService} from "../../core/datagrid";
import {NewEstablishment} from "../../modules/establishments/new-establishment";
import {IAgency} from "./agency.service";

@Injectable()
export class EstablishmentsService extends AbstractService<NewEstablishment> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient,
              private utilitiesService: UtilitiesService) {
    super();
  }

  searchForOrder(suggestForOrder: string): Observable<FullEstablishment[]> {
    const httpParams = new HttpParams().set('suggestfororder', suggestForOrder);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<FullEstablishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  search(startsWith: string): Observable<Establishment[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Establishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }

  getPage(page: number, rows: number): Observable<Establishment[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Establishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getAll(): Observable<Establishment[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Establishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getFromEntity(entityId: string): Observable<FullEstablishment[]> {
    const httpParams = new HttpParams().set('entity', entityId);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<FullEstablishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getEstablishment(uuid: string): Observable<Establishment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Establishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getFullEstablishment(uuid: string): Observable<FullEstablishment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<FullEstablishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/full/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getFromSiret(siret: string): Observable<Establishment> {
    const httpParams = new HttpParams().set('siret', siret);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Establishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  add(establishment: Establishment): Observable<UUID> {
    console.log(establishment);
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams()
      .set('login', localStorage.getItem("username"));
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments', establishment, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  update(establishment: Establishment): Observable<Establishment> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem("username"));
    return this.httpClient.patch<Establishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + establishment.uuid, establishment, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getEstablishmentDelegates(uuid: string, role?: string): Observable<EstablishmentWithRole[]> {
    if (role && !Object.values(EstablishmentDelegateRole).includes(role)) {
      console.log("Invalid role");
      return of([]);
    } else {
      let httpParams = new HttpParams();
      if (role) {
        httpParams = new HttpParams().set('role', role);
      }
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.get<EstablishmentWithRole[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/delegates', {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
    }
  }

  getEstablishmentAddress(uuid: string, role?: string): Observable<AddressWithRole[]> {
    if (role && !Object.values(EstablishmentAddressRole).includes(role)) {
      console.log("Invalid role");
      return of([]);
    } else {
      let httpParams = new HttpParams();
      if (role) {
        httpParams = new HttpParams().set('role', role);
      }
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.get<AddressWithRole[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/addresses', {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
    }
  }

  getEstablishmentPeople(uuid: string, role?: string): Observable<PeopleWithRole[]> {
    if (role && !Object.values(EstablishmentPeopleRole).includes(role)) {
      console.log("Invalid role");
      return of([]);
    } else {
      let httpParams = new HttpParams();
      if (role) {
        httpParams = new HttpParams().set('role', role);
      }
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.get<PeopleWithRole[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/people', {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
    }
  }

  addEstablishmentDelegate(uuid: string, delegateId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentDelegateRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const data = {role: role};
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.post<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/delegates/' + delegateId, data, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  addEstablishmentAddress(uuid: string, addressId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentAddressRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const data = {role: role};
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.post<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/addresses/' + addressId, data, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  addEstablishmentPeople(uuid: string, peopleId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentPeopleRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const data = {role: role};
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.post<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/people/' + peopleId, data, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  removeEstablishmentDelegate(uuid: string, delegateId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentDelegateRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/delegates/' + delegateId, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  removeEstablishmentAddress(uuid: string, addressId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentAddressRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/addresses/' + addressId, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  removeEstablishmentPeople(uuid: string, peopleId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(EstablishmentPeopleRole).includes(role)) {
      console.log("Invalid role");
      return of(null);
    } else {
      const httpParams = new HttpParams()
        .set('role', role)
        .set('login', localStorage.getItem("username"));
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/people/' + peopleId, {
        params: httpParams,
        headers: utilities.headers
      }).pipe(map(
        (resp) => {
          return !!resp;
        }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(false);
        }
      ));
    }
  }

  getEstablishmentOverview(filters: OverviewFilter[], sort: OverviewSort): Observable<EstablishmentOverview> {
    const utilities = this.utilitiesService.getUtilities();
    const body = { filters: filters, sort: sort };
    return this.httpClient.post<EstablishmentOverview>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/overviews', body, {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAllComments(uuid: string): Observable<Array<EstablishmentComment>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<EstablishmentComment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/' + uuid + '/comments', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  addComment(comment: EstablishmentComment): Observable<EstablishmentComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<EstablishmentComment>(this.baseUrl + '/v1/' + utilities.organizationName + '/establishments/comment', comment, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewEstablishment[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewEstablishment[]; total: number }>(this.baseUrl + '/v1/ADX/establishments/overviews',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }
}

export interface Establishment {
  uuid: string;
  name: string;
  corporateName: string;
  siret: string;
  agency: IAgency;
  activity: IActivity;
  description?: string;
  mail?: string;
  phone?: string;
  entity?: string;
  address?: Address;
  contact?: People;
  created?: number;
  iban: string;
  bic?: string;
  facturationAnalysis?: FacturationAnalysis;
}

export enum FacturationAnalysis {
  PRELEVEMENT = "Prélèvement",
  MOLP = "Analyse MOLP",
  ANALYSE = "Analyse"
}

export interface FullEstablishment {
  establishment: Establishment;
  account: Account;
  delegates: EstablishmentWithRole[];
  addresses: AddressWithRole[];
  contacts: PeopleWithRole[];
  hasOrders: boolean;
}

export interface EstablishmentWithRole {
  establishment: Establishment;
  role?: string;
}

export enum EstablishmentDelegateRole {
  PAYER = 'Payeur',
  BILLED = 'Facturé',
  MANAGER = 'Gestionnaire / Chargé de secteur / patrimoine',
  ADMINISTRATIVE = 'Contact / Valideur administratif',
  PURCHASER = 'Donneur d\'ordre / Apporteur d\'affaire',
  TECHNICAL = 'Responsable / Valideur technique',
  REPORT = 'Envoi de rapport',
  OTHER = 'Autre'
}

export enum EstablishmentAddressRole {
  MAIN = 'Adresse principale',
  BILLING = 'Adresse de facturation',
  DELIVERY = 'Adresse de livraison',
  OTHER = 'Adresse autre'
}

export enum EstablishmentPeopleRole {
  MAIN = 'Principal / Financier / Comptable',
  NEGOTIATOR = 'Négociateur immobilier',
  MANAGER = 'Gestionnaire / Chargé de secteur / patrimoine',
  ADMINISTRATIVE = 'Contact / Valideur administratif',
  PURCHASER = 'Donneur d\'ordre / Apporteur d\'affaire',
  TECHNICAL = 'Responsable / Valideur technique',
  REPORT = 'Envoi de rapport',
  OTHER = 'Autre'
}

export interface EstablishmentOverview {
  from: number;
  size: number;
  total: number;
  data: IndexableEstablishment[];
}
export interface EstablishmentComment {
  uuid?: string;
  idEstablishment: string;
  event?: string;
  user?: IUser;
  comment: string;
  created?: number;
}

