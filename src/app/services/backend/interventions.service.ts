import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {Prestation} from './prestations.service';
import {Expert} from './experts.service';
import {InterventionStatusLabel} from '../../modules/utils/intervention-utils';
import {PeopleWithRole} from './people.service';
import {ExportFile} from './bills.service';
import {DatePipe} from '@angular/common';
import {AbstractService} from '../../core/datagrid';
import {NewIntervention} from '../../modules/interventions/new-intervention';

@Injectable()
export class InterventionsService extends AbstractService<NewIntervention> {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private datePipe: DatePipe, private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    super();
  }

  createIntervention(intervention: CreateInterventionRequest): Observable<MaterializedIntervention> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.post<MaterializedIntervention>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/ground', intervention, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(response => this.buildIntervention(response), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  getOne(id: string): Observable<MaterializedIntervention> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<MaterializedIntervention>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + id, {
      headers: utilities.headers
    }).pipe(map(response => this.buildIntervention(response), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  getCount(): Observable<InterventionCount> {
    const httpParams = new HttpParams().set('type', 'count');
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<InterventionCount>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAll(): Observable<Array<MaterializedIntervention>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Array<MaterializedIntervention>>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions', {
      headers: utilities.headers
    }).pipe(map(response => response.map(item => this.buildIntervention(item)), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  getPage(page: number, rows: number): Observable<Array<MaterializedIntervention>> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Array<MaterializedIntervention>>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(response => response.map(item => this.buildIntervention(item)), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  getFromOrder(orderUuid: string): Observable<Array<MaterializedIntervention>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Array<MaterializedIntervention>>(this.baseUrl + '/v1/' + utilities.organizationName + '/orders/' + orderUuid + '/interventions', {
      headers: utilities.headers
    }).pipe(map(response => {
      return response.map(item => this.buildIntervention(item));
    }, catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  setParameters(id: string, params: InterventionParameters): Observable<MaterializedIntervention> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<MaterializedIntervention>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + id + '/parameters', params, {
      headers: utilities.headers
    }).pipe(map(response => this.buildIntervention(response), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  schedule(id: string): Observable<MaterializedIntervention> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.post<MaterializedIntervention>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + id + '/schedule', {}, {
      headers: utilities.headers,
      params: httpParams
    }).pipe(map(response => this.buildIntervention(response), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }

  sendMail(intervention: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + intervention + '/mail', {
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

  addInterventionPeople(uuid: string, peopleId: string, role: string): Observable<boolean> {
    const data = {peopleId: peopleId, role: role};
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + uuid + '/people', data, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  removeInterventionPeople(uuid: string, peopleId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + uuid + '/people/' + peopleId, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  updateIntervention(uuid: string, updateInfo: InterventionUpdateInfo): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.patch<any>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + uuid + '/update',
      updateInfo,
      {headers: utilities.headers, params: httpParams}
    ).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  manualScheduleIntervention(uuid: string, scheduleInfo: InterventionPlanning): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('login', localStorage.getItem('username'));
    return this.httpClient.post<any>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + uuid + '/schedule/manual',
      scheduleInfo,
      {headers: utilities.headers, params: httpParams}
    ).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(false);
      }
    ));
  }

  billIntervention(billInterventionInfo: BillInterventionInfo) {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<any>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/bill',
      billInterventionInfo,
      {headers: utilities.headers}
    ).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  mergeBills(order: string, interventions: string[], bills: string[], unmerge: boolean): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('unmerge', unmerge ? 'true' : 'false');
    return this.httpClient.patch<any>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/bill',
      {
        order: order,
        interventions: interventions,
        bills: bills
      },
      {headers: utilities.headers, params: httpParams}
    ).pipe(map(
      (resp) => {
        return !!resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  generatePhpFile(interventionId: string, interventionName: string): Observable<ExportFile> {
    const utilities = this.utilitiesService.getUtilities();
    const fileName = interventionName + '_' + this.datePipe.transform(new Date(), 'yyyy_MM_dd_HH_mm_ss') + '.php';
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + interventionId + '/file', {
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

  buildIntervention(args: any): MaterializedIntervention {
    switch (args.status) {
      case InterventionStatusLabel.DONE: {
        return new DoneIntervention(args);
      }
      case InterventionStatusLabel.INCOMPLETE: {
        return new IncompleteIntervention(args);
      }
      case InterventionStatusLabel.SCHEDULED: {
        return new ScheduleIntervention(args);
      }
      case InterventionStatusLabel.TO_SCHEDULE: {
        return new ToScheduleIntervention(args);
      }
      case InterventionStatusLabel.SETTLED: {
        return new SettledIntervention(args);
      }
      case InterventionStatusLabel.CREATED: {
        return new CreatedIntervention(args);
      }
      default: {
        return new DraftIntervention(args);
      }
    }
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewIntervention[], total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewIntervention[]; total: number }>(this.baseUrl + '/v1/ADX/interventions/overviews',
      {
        headers: utilities.headers,
        params: this.setHttpParams(filter, sort, pageIndex, pageSize)
      }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of({data: [], total: 0});
      }
    ));
  }

  getFromEstate(estateId: string): Observable<Array<MaterializedIntervention>> {
    const httpParams = new HttpParams().set('estate', estateId);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<MaterializedIntervention[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/interventions', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(response => response.map(item => this.buildIntervention(item)), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    )));
  }
}

export interface CreateInterventionRequest {
  name: string;
  createdBy: string;
  estateAddress: string;
  estateReference: string;
  orderName: string;
  clientName: string;
  accountUuid: string;
}

export interface MaterializedIntervention {
  id: string;
  status: string;

  isDraft: boolean;

  asDraft(): DraftIntervention;

  isCreated: boolean;

  asCreated(): CreatedIntervention;

  isSettled: boolean;

  asSettled(): SettledIntervention;

  isToSchedule: boolean;

  asToSchedule(): ToScheduleIntervention;

  isSchedule: boolean;

  asSchedule(): ScheduleIntervention;

  isIncomplete: boolean;

  asIncomplete(): IncompleteIntervention;

  isDone: boolean;

  asDone(): DoneIntervention;

}

abstract class BaseIntervention implements MaterializedIntervention {
  isDraft = false;

  asDraft(): DraftIntervention {
    return null;
  }

  isCreated = false;

  asCreated(): CreatedIntervention {
    return null;
  }

  isSettled = false;

  asSettled(): SettledIntervention {
    return null;
  }

  isToSchedule = false;

  asToSchedule(): ToScheduleIntervention {
    return null;
  }

  isSchedule = false;

  asSchedule(): ScheduleIntervention {
    return null;
  }

  isIncomplete = false;

  asIncomplete(): IncompleteIntervention {
    return null;
  }

  isDone = false;

  asDone(): DoneIntervention {
    return null;
  }

  abstract id: string;
  abstract status: string;
}

export class DraftIntervention extends BaseIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string }) {
    super();
  }

  public id: string = this.args.id;
  public name: string = this.args.name;
  public status: string = this.args.status;
  public createdBy: string = this.args.createdBy;
  public createDate: Date = this.args.createDate;
  public estateAddress: string = this.args.estateAddress;
  public estateReference: string = this.args.estateReference;
  public orderName: string = this.args.orderName;
  public clientName: string = this.args.clientName;
  public accountUuid: string = this.args.accountUuid;

  isDraft = true;

  asDraft(): DraftIntervention {
    return this;
  }
}

export class CreatedIntervention extends DraftIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[] }) {
    super(args);
  }

  public prestations: Prestation[] = this.args.prestations;
  public comments: Comment[] = this.args.comments;

  isDraft = false;

  isCreated = true;

  asCreated(): CreatedIntervention {
    return this;
  }
}

export class SettledIntervention extends CreatedIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[], parameters: InterventionParameters }) {
    super(args);
  }

  public parameters: InterventionParameters = this.args.parameters;

  isCreated = false;

  isSettled = true;

  asSettled(): SettledIntervention {
    return this;
  }

}

export class ToScheduleIntervention extends SettledIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[], parameters: InterventionParameters }) {
    super(args);
  }

  isSettled = false;

  isToSchedule = true;

  asToSchedule(): ToScheduleIntervention {
    return this;
  }
}

export class ScheduleIntervention extends ToScheduleIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[], parameters: InterventionParameters, planning: InterventionPlanning }) {
    super(args);
  }

  public planning: InterventionPlanning = this.args.planning;

  isToSchedule = false;

  isSchedule = true;

  asSchedule(): ScheduleIntervention {
    return this;
  }
}

export class IncompleteIntervention extends ScheduleIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[], parameters: InterventionParameters, planning: InterventionPlanning, bills: string[] }) {
    super(args);
  }

  public bills: string[] = this.args.bills;

  isSchedule = false;

  isIncomplete = true;

  asIncomplete(): IncompleteIntervention {
    return this;
  }
}

export class DoneIntervention extends IncompleteIntervention {
  constructor(protected args: { id: string, name: string, status: string, createdBy: string, createDate: Date, estateAddress: string, estateReference: string, orderName: string, clientName: string, accountUuid: string, prestations: Prestation[], comments: Comment[], parameters: InterventionParameters, planning: InterventionPlanning, bills: string[] }) {
    super(args);
  }

  isIncomplete = false;

  isDone = true;

  asDone(): DoneIntervention {
    return this;
  }
}


export interface InterventionParameters {
  accessConditions?: string;
  accessDetails?: string;
  workDescription?: string;
  interventionDate?: number;
  closureDate?: number;
  reportId?: string;
  expertLabel?: string;
  contacts: PeopleWithRole[];
}

export interface InterventionPlanning {
  startingTime: number;
  expert: Expert;
  duration: number;
}

export interface InterventionCount {
  total: number;
  draft: number;
  created: number;
  settled: number;
  to_schedule: number;
  scheduled: number;
  incomplete: number;
  done: number;
}

export interface InterventionUpdateInfo {
  interventionDate: number;
  closureDate: number;
  status: number;
  reportId?: string;
  expertLabel: string;
}

export interface BillInterventionInfo {
  order: string; // order id
  interventions: string[]; // list of intervention id
}

export enum InterventionAttachmentType {
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
}
