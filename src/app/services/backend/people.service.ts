import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {Address, AddressWithRole} from './addresses.service';
import {EstablishmentAddressRole} from './establishments.service';

@Injectable()
export class PeopleService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  add(people: People): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/people', people, {
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

  suggestAll(startsWith: string): Observable<People[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/people', {
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

  get(uuid: string): Observable<People> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People>(this.baseUrl + '/v1/' + utilities.organizationName + '/people/' + uuid, {
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

  getAll(): Observable<People[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/people', {
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

  getPage(page: number, rows: number): Observable<People[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/people', {
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

  update(people: People): Observable<People> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch<People>(this.baseUrl + '/v1/' + utilities.organizationName + '/people/' + people.uuid, people, {
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

  getPeopleAddresses(uuid: string, role?: string): Observable<AddressWithRole[]> {
    if (role && !Object.values(PeopleAddressRole).includes(role)) {
      console.log('Invalid role');
      return of([]);
    } else {
      const httpParams = new HttpParams();
      if (role) {
        httpParams.set('role', role);
      }
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.get<AddressWithRole[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/people/' + uuid + '/addresses', {
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
  }

  addPeopleAddress(uuid: string, addressId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(PeopleAddressRole).includes(role)) {
      console.log('Invalid role');
      return of(null);
    } else {
      const data = {role: role};
      const httpParams = new HttpParams().set('role', role);
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.post<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/people/' + uuid + '/addresses/' + addressId, data, {
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

  removePeopleAddress(uuid: string, addressId: string, role: string): Observable<boolean> {
    if (!role || !Object.values(PeopleAddressRole).includes(role)) {
      console.log('Invalid role');
      return of(null);
    } else {
      const httpParams = new HttpParams().set('role', role);
      const utilities = this.utilitiesService.getUtilities();
      return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/people/' + uuid + '/addresses/' + addressId, {
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

  getPurchasers(establishment: string, market: string): Observable<PeopleWithOrigin[]> {
    const httpParams = market ? new HttpParams().set('market', market) : new HttpParams();
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<PeopleWithOrigin[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/people/purchasers/' + establishment, {
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

export interface People {
  uuid: string;
  title: PeopleTitle;
  lastname: string;
  firstname: string;
  workMail?: string;
  email?: string;
  workPhone?: string;
  mobilePhone?: string;
  jobDescription?: string;
  addresses?: AddressWithRole[];
}

export interface PeopleWithRole {
  people: People;
  role?: string;
}

export interface PeopleWithOrigin {
  people: People;
  origin: string;
}

export enum PeopleTitle {
  MS = 'Madame',
  MR = 'Monsieur'
}

export enum PeopleAddressRole {
  MAIN = 'Adresse principale',
  BILLING = 'Adresse de facturation',
  DELIVERY = 'Adresse de livraison',
  OTHER = 'Adresse autre'
}
