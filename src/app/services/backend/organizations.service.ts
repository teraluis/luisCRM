import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {catchError} from 'rxjs/internal/operators';
import {InfoService} from '../front/info.service';
import {UtilitiesService} from './utilities.service';


@Injectable()
export class OrganizationsService {
  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService, private infoService: InfoService) {
  }

  getOrganization(token: string): Observable<boolean> {
    return this.httpClient.get<Organization[]>(environment.orbitUrl + '/protected/organizations', {
      headers: new HttpHeaders({
        user_token: token
      }),
      responseType: 'json'
    }).pipe(map(
      (resp) => {
        const organizations = resp;
        if (organizations.length === 1) {
          localStorage.setItem('organization', JSON.stringify(organizations[0]));
          return true;
        } else if (organizations.length === 0) {
          this.infoService.displayError('Vous n\'avez pas les droits pour accéder à Calypso.', null, 10000, false);
          return false;
        } else {
          this.infoService.displayError('Un utilisateur ne peut avoir accès à plusieurs organisations.', null, 10000, false);
          return false;
        }
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [], 4000, false);
        return of(false);
      }
    ));
  }

  getPrivileges(): Observable<boolean> {
    const token: string = localStorage.getItem('token');
    const organization: Organization = JSON.parse(localStorage.getItem('organization'));
    return this.httpClient.post(environment.orbitUrl + '/protected/privileges', organization, {
      headers: new HttpHeaders({
        user_token: token,
      })
    }).pipe(map(
      (resp) => {
        localStorage.setItem('privileges', JSON.stringify(resp));
        return true;
      }),
      catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      })
    );
  }
}

export interface Organization {
  uuid: string;
  name: string;
}
