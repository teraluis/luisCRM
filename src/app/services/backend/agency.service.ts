import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {UUID} from '../../core/UUID';
import {environment} from '../../../environments/environment';
import {IUser} from "./users.service";

@Injectable({providedIn: 'root'})
export class AgencyService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
  }

  get(uuid: string): Observable<IAgency> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAgency>(this.baseUrl + '/v1/' + utilities.organizationName + '/agencies/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => this.catchError(error)));
  }

  getPage(page: number, rows: number): Observable<IAgency[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getActivity(httpParams);
  }

  getAll(): Observable<IAgency[]> {
    const httpParams = new HttpParams().set('page', '0').set('rows', '100');
    return this.getActivity(httpParams);
  }

  add(agency: IAgency): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/agencies', agency, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => this.catchError(error)));
  }

  update(agency: IAgency): Observable<IAgency> {
    const utilities = this.utilitiesService.getUtilities();
    const formData: FormData = new FormData();
    formData.append('name', agency.name);
    formData.append('manager', JSON.stringify(agency.manager));

    return this.http.patch<IAgency>(this.baseUrl + '/v1/' + utilities.organizationName + '/agencies/' + agency.uuid, agency, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => this.catchError(error)));
  }

  search(startsWith: string): Observable<IAgency[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAgency[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/agencies', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  private getActivity(httpParams: HttpParams): Observable<IAgency[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAgency[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/agencies', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => this.catchError(error)));
  }

  private catchError(error: HttpErrorResponse) {
    this.utilitiesService.handleError(error);
    return of(null);
  }
}

export interface IAgency {
  uuid: string;
  code: string;
  name: string;
  manager: IUser;
  created?: number;
  referenceIban?: string;
  referenceBic?: string;
  officies?: any[];

  toString(): string;
}

export class Agency implements IAgency {
  constructor(
    public uuid: string,
    public code: string,
    public name: string,
    public manager: IUser,
    public created: number,
    public referenceIban: string,
    public referenceBic: string,
    public officies: any[],
  ) {
  }

  static fromData(data: IAgency): Agency {
    const {uuid, code, name, manager, created, referenceIban, referenceBic, officies} = data;
    return new this(uuid, code, name, manager, created, referenceIban, referenceBic, officies);
  }

  toString = (): string => {
    return this.name;
  }
}
