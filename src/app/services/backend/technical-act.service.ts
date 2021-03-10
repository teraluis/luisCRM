import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {UUID} from '../../core/UUID';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class TechnicalActService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
  }

  get(uuid: string): Observable<ITechnicalAct> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<ITechnicalAct>(this.baseUrl + '/v1/' + utilities.organizationName + '/technical-act/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getPage(page: number, rows: number): Observable<ITechnicalAct[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getTechnicalAct(httpParams);
  }

  getAll(): Observable<ITechnicalAct[]> {
    const httpParams = new HttpParams().set('page', '0').set('rows', '100');
    return this.getTechnicalAct(httpParams);
  }

  add(technicalAct: ITechnicalAct): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/technical-act', technicalAct, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  update(technicalAct: ITechnicalAct): Observable<ITechnicalAct> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.patch<ITechnicalAct>(this.baseUrl + '/v1/' + utilities.organizationName + '/technical-act/' + technicalAct.uuid, technicalAct, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  delete(uuid: string): Observable<any> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.delete<ITechnicalAct>(this.baseUrl + '/v1/' + utilities.organizationName + '/technical-act/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  private getTechnicalAct(httpParams: HttpParams): Observable<ITechnicalAct[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<ITechnicalAct[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/technical-act', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }
}

export interface ITechnicalAct {
  uuid: string;
  name: string;
  shortcut: string;
  typeTVA: number;
  codeTVA: string;
  profilTVA: string;
  schedulerId: string;
  hasAnalyse?: boolean;
  created?: number;
  surfaceType?: string;
  productType?: string;
  offerCode?: string;
  comment?: string;
  businessCode?: string;
  jobRank?: string;
  jobExpertise?: string;
  description?: string;
  active?: boolean;
  web?: boolean;
}

export class TechnicalAct implements ITechnicalAct {
  constructor(
    public uuid: string,
    public name: string,
    public shortcut: string,
    public typeTVA: number,
    public codeTVA: string,
    public profilTVA: string,
    public schedulerId: string,
    public hasAnalyse?: boolean,
    public created?: number,
    public surfaceType?: string,
    public productType?: string,
    public offerCode?: string,
    public comment?: string,
    public businessCode?: string,
    public jobRank?: string,
    public jobExpertise?: string,
    public description?: string,
    public active?: boolean,
    public web?: boolean
  ) {
  }
}

export enum tvaEnum {
  TVA_0,
  TVA_10,
  TVA_20
}

export enum shortcuts {
  RAAT = 'RAAT',
  DAPP = 'DAPP',
  ELEC = 'ELEC',
  GAZ = 'GAZ',
  PLOMB = 'PLOMB',
  DPE = 'DPE'
}
