import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {AbstractService} from "../../core/datagrid";

@Injectable({providedIn: 'root'})
export class OfficeService extends AbstractService<IOffice> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  getAll(): Observable<IOffice[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IOffice[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/office', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getOne(uuid: string): Observable<IOffice> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IOffice>(this.baseUrl + '/v1/' + utilities.organizationName + '/office/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  search(value: string): Observable<IOffice[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IOffice[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/office/search/' + value, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getByAgencyId(uuid: string): Observable<IOffice[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IOffice[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/office/agency/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  update(office: IOffice): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.patch<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/office', office, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: IOffice[]; total: number }> {
    return undefined;
  }
}

export interface IOffice {
  uuid?: string;
  name?: string;
  agency?: string;

  toString(): string;
}

export class Office implements IOffice {
  constructor(
    public uuid?: string,
    public name?: string,
    public agency?: string
  ) {
  }

  static fromData(data: IOffice): Office {
    const {uuid, name, agency} = data;
    return new this(uuid, name, agency);
  }

  toString = (): string => {
    return this.name;
  }
}
