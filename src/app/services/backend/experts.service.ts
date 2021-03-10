import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {map} from 'rxjs/operators';


@Injectable()
export class ExpertsService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  get(uuid: string): Observable<Expert> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Expert>(this.baseUrl + '/v1/' + utilities.organizationName + '/experts/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  suggestAll(startsWith: string): Observable<Expert[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Expert[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/experts', {
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

export interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  mail: string;
  pager?: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  label: string;
}
