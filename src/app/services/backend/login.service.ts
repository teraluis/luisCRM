import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Token} from '../../pages/login/login.component';
import {environment} from '../../../environments/environment';
import * as jwt_decode from 'jwt-decode';
import {catchError} from 'rxjs/internal/operators';
import {map} from 'rxjs/operators';
import {UtilitiesService} from './utilities.service';


@Injectable()
export class LoginService {
  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  login(userName: string, userPassword: string): Observable<LoginResult> {
    return this.httpClient.post<Token>(environment.orbitUrl + '/protected/token', {username: userName, password: userPassword}, {
      headers: new HttpHeaders({
        'Content-type': 'application/json'
      })
    }).pipe(map(
      (resp) => {
        localStorage.setItem('token', resp.token);
        localStorage.setItem('locale', 'en');
        const tokenInfo = jwt_decode(resp.token);
        const expiration: number = tokenInfo.expiration * 1000;
        localStorage.setItem('expiration', expiration.toString());
        localStorage.setItem('username', userName);
        return new LoginResult(true, '', null);
      }), catchError((error: HttpErrorResponse) => {
        let errorMessage;
        let errorMessage2 = null;
        if (error.status === 401) {
          errorMessage = 'Identifiant ou mot de passe incorrect.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits pour accéder à Calypso.';
        } else {
          if (error.error instanceof ErrorEvent) {
            errorMessage = 'Erreur interne au serveur.';
            console.log('Orbit error : ' + error.error.message);
          } else if (error.error instanceof ProgressEvent && error.error.loaded === 0) {
            errorMessage = 'Un problème technique est survenu.';
            errorMessage2 = 'Merci de nous remonter le bug et veuillez réessayer ultérieurement.';
          } else {
            errorMessage = 'Erreur interne au serveur.';
            console.log('Orbit error : ' + error.error.errorMessage);
          }
        }
        return of(new LoginResult(false, errorMessage, errorMessage2));
      }
    ));
  }

}


export class LoginResult {
  accessGranted: boolean;
  errorMessage1: string;
  errorMessage2: string;

  constructor(accessGranted: boolean, errorMessage1: string, errorMessage2: string) {
    this.accessGranted = accessGranted;
    this.errorMessage1 = errorMessage1;
    this.errorMessage2 = errorMessage2;
  }

}

export interface Organization {
  uuid: string;
  name: string;
}

