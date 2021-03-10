import {map} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError} from 'rxjs/internal/operators';
import {UtilitiesService} from './utilities.service';
import {Estimate} from './estimates.service';
import {Prestation} from './prestations.service';
import {UUID} from '../../core/UUID';
import {People} from './people.service';
import {Account} from './accounts.service';
import {Establishment, FullEstablishment} from './establishments.service';
import {IUser} from './users.service';
import {IMarket} from './markets.service';
import {PeopleUtils} from '../../modules/utils/people-utils';
import {OrderStatusLabel, OrderUtils} from '../../modules/utils/order-utils';
import {IndexableOrder} from './search.service';
import {Attachment} from './attachments.service';
import {AbstractService} from "../../core/datagrid";
import {NewOrder} from "../../modules/orders/new-order";
import {IAgency} from "./agency.service";
import {Address} from "./addresses.service";
import {AddressUtils} from "../../modules/utils/address-utils";

@Injectable()
export class OrdersService extends AbstractService<NewOrder> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  add(order: Order): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem("username"));
    const orderForm: OrderForm = OrdersService.buildOrderForm(order, new Date());
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', orderForm, {
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

  private static buildOrderForm(order: Order, receivedDate: Date): OrderForm {
    return {
      name: order.name,
      status: order.status,
      market: order.market ? order.market.uuid : null,
      account: order.account.uuid,
      purchaserContact: order.purchaserContact.uuid,
      establishment: order.establishment ? order.establishment.establishment.uuid : null,
      commercial: order.commercial.login,
      received: receivedDate.getTime()
    };
  }

  suggestFromMarket(market: string): Observable<Order[]> {
    const httpParams = new HttpParams().set('market', market);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
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

  suggestFromEstimate(estimate: string): Observable<Order[]> {
    const httpParams = new HttpParams().set('estimate', estimate);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
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

  suggestAll(startsWith: string): Observable<Order[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
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

  getWithName(name: string): Observable<UUID> {
    const httpParams = new HttpParams().set('name', name);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
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

  getCount(): Observable<OrdersCount> {
    const httpParams = new HttpParams().set('type', 'count');
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<OrdersCount>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
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

  getOne(uuid: string): Observable<Order> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid, {
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

  getReferenceFile(uuid: string, name: string): Observable<Blob> {
    const httpParams = new HttpParams().set('file', name);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid + '/referencefiles', {
      params: httpParams,
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        const blob = new File([resp.body], name, {lastModified: new Date().getTime()});
        return blob.slice(0, blob.size, resp.headers.get('Content-Type'));
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAll(): Observable<Array<Order>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  update(order: Order, file?: File): Observable<Order> {
    const utilities = this.utilitiesService.getUtilities();
    const formData: FormData = OrderUtils.buildUpdateForm(order, file);
    const httpParams = new HttpParams().set('login', localStorage.getItem("username"));
    return this.httpClient.patch<Order>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + order.uuid, formData, {
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

  delete(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid, {
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

  setOrderLines(orderUuid: string, setOrderLines: SetOrderLines): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + orderUuid + '/orderlines', setOrderLines, {
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

  setOrderLinesInBatch(orderUuid: string, setOrderLinesList: SetOrderLines[]): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + orderUuid + '/orderlines/batch', setOrderLinesList, {
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

  setStatus(uuid: string, statusName: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem("username"));
    return this.httpClient.patch(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid + '/status', {status: statusName}, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(
      () => {
        return true;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  getRecap(uuid: string): Observable<OrderRecap> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<OrderRecap>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid + '/recap', {
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

  getAllComments(uuid: string): Observable<Array<OrderComment>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<OrderComment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + uuid + '/comments', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  addComment(comment: OrderComment): Observable<OrderComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<OrderComment>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/comment', comment, {
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

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewOrder[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewOrder[]; total: number }>(this.baseUrl + '/v1/ADX/orders/overviews',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }

  getFromEstate(estateId: string): Observable<Array<Order>> {
    const httpParams = new HttpParams().set('estate', estateId);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getFromEstablishment(establishmentId: string): Observable<Array<Order>> {
    const httpParams = new HttpParams().set('establishment', establishmentId);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getFromAccount(accountId: string): Observable<Array<Order>> {
    const httpParams = new HttpParams().set('account', accountId);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Order[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  addReportDestination(repDest: ReportDestination): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/repdest', repDest, {
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

  updateReportDestination(repDest: ReportDestination): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.patch<boolean>(this.baseUrl + '/v1/' + utilities.organizationName + '/repdest', repDest, {
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

  removeReportDestination(uuid: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/repdest/' + uuid, {
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
}

export interface Order {
  uuid: string;
  name: string;
  status: OrderStatusLabel;
  created: number;
  account: Account;
  market?: IMarket;
  estimate?: Estimate;
  referenceNumber?: string;
  referenceFile?: string;
  received?: number;
  deadline?: number;
  adviceVisit?: number;
  assessment?: number;
  description?: string;
  workdescription?: string;
  purchaserContact?: People;
  commercial?: IUser;
  establishment?: FullEstablishment;
  commentary?: string;
  orderLines: OrderLine[];
  reportDestinations: ReportDestination[];
  attachment: Attachment;
  agency?: IAgency;
  billedEstablishment?: Establishment;
  billedContact?: People;
  payerEstablishment?: Establishment;
  payerContact?: People;
}

export interface OrderLine {
  uuid: string;
  refadx: string;
  refbpu?: string;
  designation?: string;
  price: number;
  quantity: number;
  discount: number;
  tvacode: string;
  total: number;
}

export enum OrderAttachmentType {
  PURCHASE_ORDER = 'Bon de commande',
  PLAN = 'Plan',
  PHOTO = 'Photo',
  LISTING = 'Listing',
  EMAIL = 'Email',
  OPERATION = 'Opération',
  OLD_SPOTTING = 'Ancien repérage',
  HEATING_BILL = 'Facture chauffage',
  MATERIALS_BILL = 'Facture matériaux',
  WORK_PROGRAM = 'Programme des travaux',
  DELEGATION_PAYMENT = 'Prise en charge (PEC) - Délégation de paiement',
  ESTIMATE = 'Devis'

}

export interface OrdersCount {
  total: number;
  received: number;
  filled: number;
  production: number;
  billable: number;
  honored: number;
  closed: number;
  deadlineOutdated: number;
  deadlineClose: number;
  deadlineOk: number;
}

export interface ReportDestination {
  uuid: string;
  order: string;
  mail?: string;
  url?: string;
  address?: Address;
  people?: People;
  establishment?: Establishment;
}

export class ReportDestinationDisplay {

  reportDestination: ReportDestination;

  constructor(reportDestination: ReportDestination) {
    this.reportDestination = reportDestination;
  }

  display(): string {
    if (this.reportDestination.mail) {
      return this.reportDestination.mail;
    }
    if (this.reportDestination.url) {
      return this.reportDestination.url;
    }
    if (this.reportDestination.address) {
      return AddressUtils.getFullName(this.reportDestination.address);
    }
    if (this.reportDestination.people) {
      return PeopleUtils.getName(this.reportDestination.people);
    }
    if (this.reportDestination.establishment) {
      return this.reportDestination.establishment.name;
    }
    return '';
  }
}

export interface OrderRecap {
  status: OrderStatusLabel;
  clientName: string;
  marketName?: string;
  referenceNumber?: string;
  referenceFile?: string;
  targets: string[];
  estateWithoutPrestations: number;
  interventionCreated: number;
  billsCreated?: number;
  billedTotal: number;
}

export interface OrderOverview {
  from: number;
  size: number;
  total: number;
  data: IndexableOrder[];
}

export interface OrderComment {
  uuid?: string;
  idOrder: string;
  user: IUser;
  comment: string;
  created?: number;
  event?: string;
}

export interface OrderLineWithPrestations {
  orderLine: OrderLine;
  prestations: Prestation[];
}

export interface SetOrderLines {
  oldPrestations: Prestation[];
  newPrestations: OrderLineWithPrestations[];
  analyseOrderLines: OrderLine[];
}

// Used only by this service
interface OrderForm {
  name: string;
  status: OrderStatusLabel;
  created?: number;
  market?: string;
  account: string;
  purchaserContact?: string;
  establishment?: string;
  commercial?: string;
  received?: number;
  estimate?: string;
}
