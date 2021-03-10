import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {catchError} from 'rxjs/internal/operators';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

@Injectable()
export class FeedbackService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  post(comment: string, file: File): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const formData: FormData = new FormData();
    if (file) {
      formData.append('file', file, file.name);
    }
    formData.append('username', localStorage.getItem('username'));
    formData.append('comment', comment);
    return this.httpClient.post(this.baseUrl + '/v1/comment', formData, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

}
