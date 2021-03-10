import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {HttpEvent} from '@angular/common/http/src/response';
import {UtilitiesService} from "./utilities.service";
import {environment} from "../../../environments/environment";
import {map} from "rxjs/operators";
import {catchError} from "rxjs/internal/operators";
import {Observable, of} from "rxjs";

@Injectable()
export class ReportService {
  // @ts-ignore
  baseUrl = environment.reportsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  getStorageInfo(reportId: string): Observable<DistantStorageInfo> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<DistantStorageInfo>(this.baseUrl + '/v1/reports/' + reportId, {
      headers: utilities.headers
    }).pipe(
      map((resp) => resp),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
  }

  setStorageInfo(baseUrl: string,
                 library: string,
                 relativeUrl: string,
                 interventionName: string,
                 finalReportPdfRelUrl?: string,
                 ddtPdfRelUrl?: string,
                 gasPdfRelUrl?: string,
                 elecPdfRelUrl?: string,
                 dappPdfRelUrl?: string,
                 raatPdfRelUrl?: string,
                 termitePdfRelUrl?: string,
                 measurementPdfRelUrl?: string): Observable<DistantStorageInfo> {
    const utilities = this.utilitiesService.getUtilities();
    const body = {
      baseUrl,
      library,
      relativeUrl,
      interventionName,
      finalReportPdfRelUrl,
      ddtPdfRelUrl,
      gasPdfRelUrl,
      elecPdfRelUrl,
      dappPdfRelUrl,
      raatPdfRelUrl,
      termitePdfRelUrl,
      measurementPdfRelUrl
    };
    return this.httpClient.post<DistantStorageInfo>(this.baseUrl + '/v1/reports/storageinfo', body, {headers: utilities.headers}).pipe(
      map((resp) => {
        return resp;
      }),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      )
    );
  }

  // PATCH        /v1/reports/:reportId
  updateStorageInfo(info: DistantStorageInfo): Observable<DistantStorageInfo> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch<DistantStorageInfo>(this.baseUrl + '/v1/reports/' + info.reportId, info, {headers: utilities.headers}).pipe(
      map((resp) => {
        return resp;
      }),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      )
    );
  }

//  GET          /v1/reports/urls
  getUrls(): Observable<Urls> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Urls>(this.baseUrl + '/v1/reports/urls', {
      headers: utilities.headers
    }).pipe(
      map((resp) => resp),
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      ));
  }

  /**
   * Build the request to upload a file on SP and have the result with progress bar.
   * To catch the whole process and the final result: do not take(1) before subscription.
   * Instead subscribe to the events and check its type
   * @param externalDoc contains a file and the form data info
   */
//  POST         /v1/reports/manual
  uploadManualReport(externalDoc: ExternalDocFormData): Observable<HttpEvent<DistantStorageInfo>> {
    const utilities = this.utilitiesService.getUtilities();
    const formData: FormData = new FormData();
    Object.keys(externalDoc).forEach(key => {
      if (key === 'file') {
        const value: File = externalDoc[key] as File;
        formData.append('file', value, value.name);
      } else {
        const value: string = externalDoc[key] as string;
        formData.append(key, value);
      }
    });

    return this.httpClient.post<HttpEvent<DistantStorageInfo>>(this.baseUrl + '/v1/reports/manual', formData, {headers: utilities.headers, reportProgress: true, observe: 'events'}).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of(null);
        }
      )
    );
  }

}

export interface DistantStorageInfo {
  reportId: string;
  baseUrl: string;
  library: string;
  relativeUrl: string;
  interventionName: string;
  interventionSubName: string;
  finalReportPdfRelUrl: string;
  ddtPdfRelUrl: string;
  gasPdfRelUrl: string;
  elecPdfRelUrl: string;
  dappPdfRelUrl: string;
  raatPdfRelUrl: string;
  termitePdfRelUrl: string;
  measurementPdfRelUrl: string;
}

export interface Urls {
  baseUrl: string;
  library: string;
}

export interface ExternalDocFormData extends ExternalDoc {
  file: File;
}

export interface ExternalDoc {
  interventionId: string;
  interventionName: string;
  interventionDate: number; // date in millis
  interventionType?: string;
  expert?: string;
  clientName?: string;
  clientAddress?: string;
  clientZipCode?: string;
  clientCity?: string;
  estateAddress?: string;
  estateZipCode?: string;
  estateCity?: string;
  DOAddress?: string;
  DOZipCode?: string;
  DOCity?: string;
  comment?: string;
  reportState?: string;
}
