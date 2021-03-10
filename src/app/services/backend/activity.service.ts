import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {catchError} from 'rxjs/internal/operators';
import {UUID} from '../../core/UUID';

@Injectable({providedIn: 'root'})
export class ActivityService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
  }

  get(uuid: string): Observable<IActivity> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IActivity>(this.baseUrl + '/v1/' + utilities.organizationName + '/activities/' + uuid, {
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

  getPage(page: number, rows: number): Observable<IActivity[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getActivity(httpParams);
  }

  getAll(): Observable<IActivity[]> {
    const httpParams = new HttpParams().set('page', '0').set('rows', '100');
    return this.getActivity(httpParams);
  }

  add(activity: IActivity): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/activities', activity, {
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

  update(activity: IActivity): Observable<IActivity> {
    const utilities = this.utilitiesService.getUtilities();
    const formData: FormData = new FormData();
    formData.append('name', activity.name);
    formData.append('description', activity.description);

    return this.http.patch<IActivity>(this.baseUrl + '/v1/' + utilities.organizationName + '/activities/' + activity.uuid, formData, {
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

  private getActivity(httpParams: HttpParams): Observable<IActivity[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IActivity[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/activities', {
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
}

export interface IActivity {
  uuid: string;
  name: string;
  description?: string;
  created?: number;
}

export class Activity implements IActivity {
  constructor(
    public uuid: string,
    public name: string,
    public description: string,
    public created: number
  ) {
  }
}
