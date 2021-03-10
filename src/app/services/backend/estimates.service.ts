import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {Account} from './accounts.service';
import {UUID} from '../../core/UUID';
import {IMarket} from "./markets.service";

@Injectable()
export class EstimatesService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  private addRequest(body): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates', body, {
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

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  add(nameInput: string): Observable<UUID> {
    const body = {name: nameInput};
    return this.addRequest(body);
  }

  addForMarket(nameInput: string, marketInput: string): Observable<UUID> {
    const body = {name: nameInput, market: marketInput};
    return this.addRequest(body);
  }

  addForAccount(nameInput: string, accountInput: string): Observable<UUID> {
    const body = {name: nameInput, account: accountInput};
    return this.addRequest(body);
  }

  suggestFromAccount(account: string): Observable<Estimate[]> {
    const httpParams = new HttpParams().set('account', account);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estimate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates', {
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

  suggestFromMarket(market: string): Observable<Estimate[]> {
    const httpParams = new HttpParams().set('market', market);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estimate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates', {
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

  suggestAll(startsWith: string): Observable<Estimate[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estimate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates', {
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

  get(uuid: string): Observable<Estimate> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estimate>(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates/' + uuid, {
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

  patch(uuid: string, nameInput: string, marketInput?: string, accountInput?: string): Observable<boolean> {
    const body = {name: nameInput, market: marketInput, account: accountInput};
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates/' + uuid, body, {
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

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/estimates/' + uuid, {
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
}

export interface Estimate {
  uuid: string;
  name: string;
  market?: IMarket;
  account?: Account;
}
