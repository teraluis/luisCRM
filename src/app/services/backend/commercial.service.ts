import {Observable, of} from 'rxjs';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import {People} from './people.service';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {UtilitiesService} from './utilities.service';


@Injectable()
export class CommercialService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  suggest(accountId: string): Observable<People[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/commercials', {
      params: new HttpParams().set('accountId', accountId),
      headers: utilities.headers
    }).pipe(
      map(resp => resp),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
  }

  suggestAll(): Observable<People[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/commercials', {
      headers: utilities.headers
    }).pipe(
      map(resp => resp),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
  }

  get(uuid: string): Observable<People> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<People>(this.baseUrl + '/v1/' + utilities.organizationName + '/commercials/' + uuid, {
      headers: utilities.headers
    }).pipe(
      map(resp => resp),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
  }

}
