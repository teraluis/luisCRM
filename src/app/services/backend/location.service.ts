import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';

@Injectable()
export class LocationService {

  // @ts-ignore
  baseUrl = environment.estatesUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  public search(text: string, maximumResponses: string, countryCode: string, matchLevels: string): Observable<Location[]> {
    const httpParams = new HttpParams().set('text', text).set('maximumResponses', maximumResponses).set('countryCode', countryCode).set('matchLevels', matchLevels);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Location[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/locations', {
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

export interface Location {
  fulltext?: string;
  language?: string;
  countryCode?: string;
  matchLevel?: string;
  distance?: string;
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  postCode?: string;
  district?: string;
  street?: string;
  streetNumber?: string;
}
