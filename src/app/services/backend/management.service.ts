import {UtilitiesService} from './utilities.service';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ExportFile} from './bills.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {map} from 'rxjs/operators';
import {DatePipe} from '@angular/common';

@Injectable()
export class ManagementService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private datePipe: DatePipe, private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  exportBills(startdate: number, enddate: number): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = 'calypso_' + this.datePipe.transform(startdate, 'yyyy_MM_dd') + '_' + this.datePipe.transform(enddate, 'yyyy_MM_dd') + '_facturation.csv';
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/management/bills', {
      params: this.createHttpParams(startdate, enddate),
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new Blob(['\ufeff', resp.body], {type: resp.headers.get('Content-Type')});
        return {
          image: blob,
          fileName: fileName
        };
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  exportPayments(startdate: number, enddate: number): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = 'calypso_' + this.datePipe.transform(startdate, 'yyyy_MM_dd') + '_' + this.datePipe.transform(enddate, 'yyyy_MM_dd') + '_encaissement.csv';
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/management/payments', {
      params: this.createHttpParams(startdate, enddate),
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new Blob(['\ufeff', resp.body], {type: resp.headers.get('Content-Type')});
        return {
          image: blob,
          fileName: fileName
        };
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  exportRecovery(startdate: number, enddate: number): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = 'calypso_' + this.datePipe.transform(startdate, 'yyyy_MM_dd') + '_' + this.datePipe.transform(enddate, 'yyyy_MM_dd') + '_encaissement.csv';
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/management/recovery', {
      params: this.createHttpParams(startdate, enddate),
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new Blob(['\ufeff', resp.body], {type: resp.headers.get('Content-Type')});
        return {
          image: blob,
          fileName: fileName
        };
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  exportInProgress(startdate: number, enddate: number): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = 'calypso_' + this.datePipe.transform(startdate, 'yyyy_MM_dd') + '_' + this.datePipe.transform(enddate, 'yyyy_MM_dd') + '_encaissement.csv';
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/management/inprogress', {
      params: this.createHttpParams(startdate, enddate),
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new Blob(['\ufeff', resp.body], {type: resp.headers.get('Content-Type')});
        return {
          image: blob,
          fileName: fileName
        };
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  createHttpParams(startdate: number, enddate: number) {
    return new HttpParams().set('startdate', this.datePipe.transform(startdate, 'yyyy-MM-dd')).set('enddate', this.datePipe.transform(enddate, 'yyyy-MM-dd'));
  }
}
