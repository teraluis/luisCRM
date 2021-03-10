import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from "../../core/UUID";

@Injectable()
export class AddressesService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  search(startsWith: string, request: string): Observable<Address[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith).set('request', request);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Address[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses', {
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

  searchPage(startsWith: string, page: number, rows: number, request: string): Observable<Address[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith).set('page', page.toString()).set('rows', rows.toString()).set('request', request);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Address[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses', {
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

  getAll(): Observable<Address[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Address[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses', {
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

  getPage(page: number, rows: number): Observable<Address[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Address[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses', {
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

  get(uuid: string): Observable<Address> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Address>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses/' + uuid, {
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

  add(address: Address): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses', address, {
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

  update(address: Address): Observable<Address> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch<Address>(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses/' + address.uuid, address, {
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

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/addresses/' + uuid, {
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

export interface Address {
  uuid: string;
  type: AddressType;
  address1?: string;
  address2?: string;
  postCode?: string;
  city?: string;
  gpsCoordinates?: string;
  inseeCoordinates?: string;
  dispatch?: string;
  staircase?: string;
  wayType?: string;
  country?: string;
  created?: string;
}

export interface AddressWithRole {
  address: Address;
  role?: string;
}

export enum AddressType {
  PHYSICAL = 'Physique',
  POST = 'Postale',
  COORDINATES = 'Coordonnées'
}
