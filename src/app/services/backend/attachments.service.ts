import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {AbstractService} from "../../core/datagrid";
import {map} from "rxjs/operators";

@Injectable({providedIn: 'root'})
export class AttachmentsService extends AbstractService<IAttachment> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  getAll(): Observable<IAttachment[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAttachment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getOne(uuid: string): Observable<IAttachment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAttachment>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: IAttachment[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<{ data: IAttachment[]; total: number }>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }

  getByEntityId(uuid: string): Observable<IAttachment[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAttachment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/entity/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getHistory(uuid: string): Observable<IAttachment[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IAttachment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/history/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getFile(uuid: string, filename: string, collection: string): Observable<Blob> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('filename', filename);
    httpParams = httpParams.set('collection', collection);
    console.log(httpParams);
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/file/' + uuid, {
      params: httpParams,
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new File([resp.body], filename, {lastModified: new Date().getTime()});
        return blob.slice(0, blob.size, resp.headers.get('Content-Type'));
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  add(attachment: IAttachment, oldFileUuid, file: File, collection?, objectUuid?): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment', JSON.stringify(attachment));
    formData.append('fileType', file.type);
    formData.append('collection', collection);
    formData.append('objectUuid', objectUuid);

    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/' + oldFileUuid, formData, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }
}

export interface IAttachment {
  uuid?: string;
  vfk?: string;
  filename?: string;
  user?: any;
  created?: Date;
  attachmentType?: string;
  attachedUuid?: string;


  toString(): string;
}

export class Attachment implements IAttachment {
  constructor(
    public uuid?: string,
    public vfk?: string,
    public filename?: string,
    public user?: any,
    public created?: Date,
    public attachmentType?: string,
    public attachedUuid?: string
  ) {
  }

  static fromData(data: IAttachment): Attachment {
    const {uuid, vfk, filename, user, created, attachmentType, attachedUuid} = data;
    return new this(uuid, vfk, filename, user, created, attachmentType, attachedUuid);
  }

  toString = (): string => {
    return this.filename;
  }
}
