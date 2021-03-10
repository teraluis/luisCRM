import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {UUID} from '../../core/UUID';
import {catchError} from 'rxjs/internal/operators';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Order} from './orders.service';
import {DatePipe} from '@angular/common';
import {Account} from './accounts.service';
import {IUser} from './users.service';
import {MaterializedIntervention} from './interventions.service';
import {AbstractService} from '../../core/datagrid';
import {NewBill} from '../../modules/bills/new-bill';


@Injectable()
export class BillsService extends AbstractService<NewBill> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private datePipe: DatePipe, private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  validate(uuid: string, lines: BillLineAdd[], deadline: number): Observable<Bill> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    const body = {
      lignes: lines,
      deadline: deadline
    };
    return this.httpClient.patch<Bill>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + uuid, body, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getCount(): Observable<BillCount> {
    const httpParams = new HttpParams().set('type', 'count');
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<BillCount>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAll(): Observable<Bill[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Bill>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills', {
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

  getOne(uuid: string): Observable<Bill> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Bill>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + uuid, {
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

  getFromOrder(order: string): Observable<BillDetails[]> {
    const httpParams = new HttpParams().set('order', order);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<BillDetails[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/billswithdetails', {
      params: httpParams,
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

  getWithName(name: string): Observable<UUID> {
    const httpParams = new HttpParams().set('name', name);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills', {
      params: httpParams,
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

  getCreditNoteWithName(name: string): Observable<UUID> {
    const httpParams = new HttpParams().set('name', name);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/creditnotes', {
      params: httpParams,
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

  addPayment(payment: Payment, billUuid: string) {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + billUuid + '/payments', payment, {
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

  addCreditNote(billUuid: string, interventions: string[]) {
    // adding credit note for the whole bill
    const utilities = this.utilitiesService.getUtilities();
    const body = {
      interventions: interventions
    };
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + billUuid + '/creditnotes', body, {
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

  getWithDetails(): Observable<BillDetails[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<BillDetails[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/billswithdetails', {
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

  getPage(page: number, rows: number): Observable<BillDetails[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<BillDetails[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/billswithdetails', {
      params: httpParams,
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

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  export(): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = 'calypso_' + this.datePipe.transform(new Date(), 'yyyy_MM_dd_HH_mm_ss') + '_sage100.txt';
    return this.httpClient.post(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/export', {name: fileName}, {
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new Blob([resp.body], {type: 'octet/stream'});
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

  getAllComments(uuid: string): Observable<Array<BillComment>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<BillComment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/' + uuid + '/comments', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  addComment(comment: BillComment): Observable<BillComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<BillComment>(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/comment', comment, {
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

  getPdf(billId: string, name: string): Observable<Blob> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/bills/pdf/' + billId, {
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new File([resp.body], `Facture ${name}.pdf`, {lastModified: new Date().getTime()});
        return blob.slice(0, blob.size, resp.headers.get('Content-Type'));
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  triggerSage1000Export(): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/sage1000/trigger', {
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

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewBill[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewBill[]; total: number }>(this.baseUrl + '/v1/ADX/bills/overviews',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }
}

export interface Bill {
  uuid: string;
  name: string;
  accompte: boolean;
  recoverystatus?: string;
  status: string;
  lignes: BillLine[];
  paiements: Payment[];
  creditnotes: CreditNote[];
  order: string;
  deadline: number;
  exportDate?: number;
}

export interface BillLine {
  uuid: string;
  refadx: string;
  refbpu?: string;
  designation?: string;
  tvacode: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
  billingDate: number;
}

export interface Payment {
  uuid: string;
  type: string;
  value: number;
  received: boolean;
  date: number;
  exportDate?: number;
}

export interface CreditNote {
  uuid: string;
  name: string;
  date: number;
  exportdate?: number;
}

// Used by app-bill
export interface BillDetails {
  bill: Bill;
  account: Account;
  refNumber: string;
  order: Order;
  interventions: MaterializedIntervention[];
  address?: string;
}

export interface ExportFile {
  image?: Blob;
  fileName: string;
}

export interface BillCount {
  total: number;
  pending: number;
  confirmed: number;
  billed: number;
  cancelled: number;
  paid: number;
}

export interface BillLineAdd {
  uuid: string;
  refadx: string;
  refbpu?: string;
  designation?: string;
  tvacode: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
  billingDate: number;
  prestations: string[];
}

export interface BillComment {
  uuid?: string;
  idBill: string;
  user: IUser;
  comment: string;
  created?: number;
  event?: string;
}
