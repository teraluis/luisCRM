import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from "../../core/UUID";
import {Address} from "./addresses.service";

@Injectable()
export class EntitiesService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  search(startsWith: string): Observable<Entity[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', {
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

  searchPage(startsWith: string, page: number, rows: number): Observable<Entity[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith).set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', {
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

  getAll(): Observable<Entity[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', {
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

  getPage(page: number, rows: number): Observable<Entity[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', {
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

  get(uuid: string): Observable<Entity> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities/' + uuid, {
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

  getFromSiren(siren: string): Observable<Entity> {
    const httpParams = new HttpParams().set('siren', siren);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Entity>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', {
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

  add(entity: Entity): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities', entity, {
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

  update(entity: Entity): Observable<Entity> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch<Entity>(this.baseUrl + '/v1/' + utilities.organizationName + '/entities/' + entity.uuid, entity, {
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
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/entities/' + uuid, {
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

export interface Entity {
  uuid: string;
  name: string;
  corporateName: string;
  type?: EntityType;
  siren: string;
  domain?: EntityDomain;
  logo?: string;
  description?: string;
  mainAddress?: Address;
  created?: string;
}

export enum EntityType {
  SA = 'SA',
  SARL = 'SARL',
  SCI = 'SCI',
  SAEM = 'SAEM'
}

export enum EntityDomain {
  PUBLIC = 'Publique',
  PRIVATE = 'Privé'
}
