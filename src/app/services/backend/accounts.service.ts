import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {People} from './people.service';
import {Entity} from './entities.service';
import {IUser} from './users.service';
import {AbstractService} from '../../core/datagrid';
import {NewAccount} from '../../modules/accounts/new-account';
import {IndexableIndividual, IndexableProfessional} from './search.service';

@Injectable({providedIn: 'root'})
export class AccountsService extends AbstractService<NewAccount> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  suggestClients(startsWith: string): Observable<Account[]> {
    const httpParams = new HttpParams().set('suggest', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  search(startsWith: string): Observable<Account[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
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

  searchPage(startsWith: string, page: number, rows: number): Observable<Account[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith).set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
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

  getAll(): Observable<Account[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getPage(page: number, rows: number): Observable<Account[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getAllProfessionals(): Observable<Account[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/professionals', {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getPageProfessionals(page: number, rows: number): Observable<Account[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/professionals', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getAllIndividuals(): Observable<Account[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/individuals', {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getPageIndividuals(page: number, rows: number): Observable<Account[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/individuals', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewAccount[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewAccount[]; total: number }>(this.baseUrl + '/v1/ADX/accounts/overviews',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }

  getOne(uuid: string): Observable<Account> {
    if (uuid) {
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.get<Account>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/' + uuid, {
        headers: utilities.headers
      }).pipe(map((resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
    } else {
      return of(null);
    }
  }

  getFromEntity(entity: string): Observable<Account> {
    const httpParams = new HttpParams().set('entity', entity);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Account>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  add(account: Account): Observable<UUID> {
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    if (account) {
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts', account, {
        headers: utilities.headers,
        params: httpParams
      }).pipe(map((resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
    } else {
      return of(null);
    }
  }

  update(account: Account): Observable<Account> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.patch<Account>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/' + account.uuid, account, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/' + uuid, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(() => {
      return true;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAdnParameters(account: string): Observable<AdnParameters> {
    const httpParams = new HttpParams().set('account', account);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<AdnParameters>(this.baseUrl + '/v1/' + utilities.organizationName + '/adnparameters', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getProfessionalOverview(filters: OverviewFilter[], sort: OverviewSort): Observable<ProfessionalOverview> {
    const utilities = this.utilitiesService.getUtilities();
    const body = {filters: filters, sort: sort};
    return this.httpClient.post<ProfessionalOverview>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/professionals/overviews', body, {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getIndividualOverview(filters: OverviewFilter[], sort: OverviewSort): Observable<IndividualOverview> {
    const utilities = this.utilitiesService.getUtilities();
    const body = {filters: filters, sort: sort};
    return this.httpClient.post<IndividualOverview>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/individuals/overviews', body, {
      headers: utilities.headers
    }).pipe(map((resp) => {
      return resp;
    }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getComments(uuid: string): Observable<Array<AccountComment>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<AccountComment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/' + uuid + '/comments', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  addComment(comment: AccountComment): Observable<AccountComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<AccountComment>(this.baseUrl + '/v1/' + utilities.organizationName + '/accounts/comment', comment, {
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
}

export interface Account {
  uuid: string;
  type: AccountType;
  reference: string;
  category: AccountCategory;
  commercial: IUser;
  contact: People;
  importance?: AccountLevel;
  state?: AccountStatus;
  entity?: Entity;
  maxPaymentTime?: number;
  groups?: string[];
  created?: number;
}

export interface AccountWithRole {
  account: Account;
  role?: string;
}

export enum AccountStatus {
  VALID,
  INVALID,
  INACTIVE
}

export enum AccountLevel {
  LOW = 'Basse',
  NORMAL = 'Normale',
  HIGH = 'Haute',
  UTMOST = 'Primordiale'
}

export enum AccountCategory {
  CLIENT = 'Client',
  PROVIDER = 'Fournisseur',
  PARTNER = 'Partenaire',
  SUBCONTRACTOR = 'Sous-traitant',
  OTHER = 'Autre'
}

export enum AccountType {
  INDIVIDUAL = 'Particulier',
  PROFESSIONAL = 'Professionnel'
}

export interface AdnParameters {
  uuid: string;
  name: string;
  adnId: number;
  clienttype?: string;
}

export interface OverviewFilter {
  key: string;
  value: string;
}

export interface OverviewSort {
  order: string;
  key: string;
}

export interface ProfessionalOverview {
  from: number;
  size: number;
  total: number;
  data: IndexableProfessional[];
}

export interface IndividualOverview {
  from: number;
  size: number;
  total: number;
  data: IndexableIndividual[];
}

export interface AccountComment {
  uuid?: string;
  idAccount: string;
  user: IUser;
  comment: string;
  created?: number;
  event?: string;
}
