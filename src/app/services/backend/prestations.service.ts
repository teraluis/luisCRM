import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {ITechnicalAct} from './technical-act.service';
import {Estate} from './estates.service';
import {AnalyseType} from './analyse-type.service';

@Injectable()
export class PrestationsService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  add(prestation: PrestationForm): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations', prestation, {
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

  getAll(): Observable<Prestation[]> {
    const httpParams = new HttpParams();
    return this.buildGetFromRequest(httpParams);
  }

  getFromOrder(orderInput: string): Observable<Prestation[]> {
    const httpParams = new HttpParams().set('order', orderInput);
    return this.buildGetFromRequest(httpParams);

  }

  getFromIntervention(interventionId: string): Observable<Prestation[]> {
    const httpParams = new HttpParams().set('intervention', interventionId);
    return this.buildGetFromRequest(httpParams);
  }

  private buildGetFromRequest(httpParams: HttpParams): Observable<Prestation[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Prestation[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations', {
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

  update(uuid: string, prestation: PrestationForm): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations/' + uuid, prestation, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  // PATCH /v1/:orga/prestations/:prestaId/result
  associateResult(prestationId: string, resultUUID: UUID): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations/' + prestationId + '/result', {id: resultUUID.uuid}, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  set(oldPrestations: string[], newPrestations: Prestation[]): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const body = {oldPrestations: oldPrestations, newPrestations: newPrestations};
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations', body, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return of(true);
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  deleteFromOrder(order: string, targetId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('order', order).set('targetId', targetId);
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/prestations', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      () => {
        return of(true);
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getEstateWithPrestationsFromOrder(order: string): Observable<EstateWithPrestations[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('order', order);
    return this.httpClient.get<EstateWithPrestations[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estateWithPrestations', {
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

  getEstateWithPrestationsFromIntervention(intervention: string): Observable<EstateWithPrestations[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('intervention', intervention);
    return this.httpClient.get<EstateWithPrestations[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estateWithPrestations', {
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

export interface Prestation {
  uuid: string;
  status?: string;
  order: string;
  mission?: string;
  technicalAct?: ITechnicalAct;
  comment?: string;
  workDescription?: string;
  resultId?: string;
  analyse?: Analyse;
  estate?: string; // id of Estate
  targetId?: string; // id of Premises or Annex
  estateType?: PrestationEstateType;
  orderLine?: string;
  billLines: string[];
}

export interface PrestationForm {
  status?: string;
  order?: string;
  mission?: string;
  technicalActId?: string;
  comment?: string;
  workDescription?: string;
  resultId?: string;
  analyse?: AnalyseForm;
  estate?: string; // id of Estate
  targetId?: string; // id of Premises or Annex
  estateType?: PrestationEstateType;
  orderLine?: string;
  diagnostician?: string;
}

export enum PrestationEstateType {
  PREMISES = 'premises',
  ANNEX = 'annex'
}

export interface EstateAddressBinding {
  estateId: string;
  addressId: string;
}

export interface PrestationWithEstateAddressBinding {
  uuid: string;
  status?: string;
  order: string;
  mission?: string;
  technicalAct?: string;
  orderLine?: string;
  billLines?: string[];
  estate?: EstateAddressBinding;
}

export interface EstateWithPrestations {
  prestations: Prestation[];
  estate: Estate;
  estateInterventionStatus: string;
  interventionId?: string;
}

export interface Analyse {
  uuid: string;
  orderLineId?: string;
  type: AnalyseType;
}

export interface AnalyseForm {
  orderLine?: string;
  typeId: string;
}
