import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {catchError} from 'rxjs/internal/operators';

@Injectable()
export class AnalyseTypeService {
  // @ts-ignore
  private baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  getAll(): Observable<AnalyseType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<AnalyseType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/analyse-types', {
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

  get(analyseTypeId: string): Observable<AnalyseType> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<AnalyseType>(this.baseUrl + '/v1/' + utilities.organizationName + '/analyse-types/' + analyseTypeId, {
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

export interface AnalyseType {
  uuid: string;
  label?: string;
  description?: string;
}

export const DEFAULT_ANALYSE_TYPE_ID = 'analysetype-9ecc55ca-c86a-49fc-ae40-4ea1f98d9a32';
