import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {UUID} from '../../core/UUID';

@Injectable({providedIn: 'root'})
export class GroupService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
  }

  get(uuid: string): Observable<IGroup> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IGroup>(this.baseUrl + '/v1/' + utilities.organizationName + '/groups/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getPage(page: number, rows: number): Observable<IGroup[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getGroups(httpParams);
  }

  getAll(): Observable<IGroup[]> {
    const httpParams = new HttpParams().set('page', '0').set('rows', '100');
    return this.getGroups(httpParams);
  }

  getAccountGroups(accountUuid: string) {
    const httpParams = new HttpParams().set('account', accountUuid);
    return this.getGroups(httpParams);
  }

  add(group: IGroup): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/groups', group, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  update(group: IGroup): Observable<IGroup> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.patch<IGroup>(this.baseUrl + '/v1/' + utilities.organizationName + '/groups/' + group.uuid, group, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  private getGroups(httpParams: HttpParams): Observable<IGroup[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IGroup[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/groups', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }
}

export interface IGroup {
  uuid: string;
  name: string;
  type: string;
  category?: number;
  iban?: string;
  description?: string;
  created: number;
}

export class Group implements IGroup {
  constructor(
    public uuid: string,
    public created: number,
    public name: string,
    public type: string,
    public category?: number,
    public iban?: string,
    public description?: string
  ) {
  }
}

export enum GroupCategory {
  GCN = 'GCN',
  GCL = 'GCL',
}

export enum GroupType {
  LEGAL = 'Juridique',
  BUSINESS = 'Business',
}
