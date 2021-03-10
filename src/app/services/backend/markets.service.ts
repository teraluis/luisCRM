import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {Injectable} from '@angular/core';
import {UtilitiesService} from './utilities.service';
import {UUID} from '../../core/UUID';
import {People} from './people.service';
import {PeopleUtils} from '../../modules/utils/people-utils';
import {Agency, IAgency} from './agency.service';
import {IUser} from './users.service';
import {Establishment, FacturationAnalysis} from './establishments.service';
import {EstablishmentUtils} from '../../modules/utils/establishment-utils';

@Injectable()
export class MarketsService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private http: HttpClient, private utilitiesService: UtilitiesService) {
  }

  getAllFromEstablishment(account: string): Observable<IMarket[]> {
    const httpParams = new HttpParams().set('account', account);
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IMarket[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  suggest(startsWith: string): Observable<IMarket[]> {
    const httpParams = new HttpParams().set('startsWith', startsWith);
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IMarket[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  getPage(page: number, rows: number): Observable<IMarket[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getMarket(httpParams);
  }

  getAll(): Observable<IMarket[]> {
    const httpParams = new HttpParams().set('page', '0').set('rows', '100');
    return this.getMarket(httpParams);
  }

  get(uuid: string): Observable<IMarket> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<Market>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getSingleMarket(): Observable<IMarket> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IMarket>(this.baseUrl + '/v1/' + utilities.organizationName + '/getsinglemarket', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getBpu(uuid: string, bpu: Bpu): Observable<Blob> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid + '/bpu/' + bpu.uuid, {
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        console.log(resp.headers.get('Content-Type'));
        const blob = new File([resp.body], bpu.file, {lastModified: new Date().getTime()});
        return blob.slice(0, blob.size, resp.headers.get('Content-Type'));
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addBpu(uuid: string, file: File): Observable<Blob> {
    const utilities = this.utilitiesService.getUtilities();
    const headers = utilities.headers.append('Content-type', file.type);
    const httpParams = new HttpParams().set('filename', file.name);
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid + '/bpu', file, {
      params: httpParams,
      headers: headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  removeBpu(file: string): Observable<any> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/bpu/' + file, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }


  add(market: IMarket): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets', market, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  update(market: IMarket): Observable<IMarket> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.patch<IMarket>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + market.uuid, market, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getContact(marketUuid: string): Observable<IMarketPeople[]> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.get<IMarketPeople[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/contact/' + marketUuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addContact(marketPeople: IMarketPeople): Observable<IMarketPeople> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.post<IMarketPeople>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/contact/' + marketPeople.market.uuid, marketPeople, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Ajout non permis, ce contact est déjà relié au marché`
        }]);
        return of(null);
      }
    ));
  }

  updateContact(marketPeople: IMarketPeople, oldRole: string): Observable<IMarketPeople> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('role', oldRole);
    return this.http.patch<IMarketPeople>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketPeople.market.uuid + '/people/' + marketPeople.people.uuid, marketPeople, {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Mise à jour non permise, obligation d'avoir au moins un contact "${MarketPeopleRole.KEY}"`
        }]);
        return of(null);
      }
    ));
  }

  deleteContact(marketUuid: string, peopleUuid: string, role: string) {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('role', role);
    return this.http.delete<IMarketPeople>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUuid + '/people/' + peopleUuid, {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getEstablishments(marketUuid: string): Observable<IMarketEstablishment[]> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.get<IMarketEstablishment[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/account/' + marketUuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addEstablishment(marketAccount: IMarketEstablishment): Observable<IMarketEstablishment> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.post<IMarketEstablishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/account/' + marketAccount.market.uuid, marketAccount, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Ajout non permis, ce compte est déjà relié au marché`
        }]);
        return of(null);
      }
    ));
  }

  updateAccount(accountUuid: string, marketAccount: IMarketEstablishment): Observable<IMarketEstablishment> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.patch<IMarketEstablishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketAccount.market.uuid + '/account/' + accountUuid, marketAccount, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Mise à jour non permise, obligation d'avoir au moins un compte "${MarketEstablishmentRole.CLIENT}"`
        }]);
        return of(null);
      }
    ));
  }

  deleteEstablishment(marketUuid: string, accountUuid: string, role: string) {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('role', role);
    return this.http.delete<IMarketEstablishment>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUuid + '/account/' + accountUuid, {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getUser(marketUuid: string): Observable<IMarketUser[]> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.get<IMarketUser[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUuid + '/user', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addUser(marketUser: IMarketUser): Observable<IMarketUser> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.post<IMarketUser>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUser.market.uuid + '/user', marketUser, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Ajout non permis, cet utilisateur est déjà relié au marché`
        }]);
        return of(null);
      }
    ));
  }

  updateUser(marketUser: IMarketUser): Observable<IMarketUser> {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.patch<IMarketUser>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUser.market.uuid + '/user/' + marketUser.user.login, marketUser, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error, [{
          status: 403,
          content: `Mise à jour non permise, obligation d'avoir au moins un utilisateur "${MarketUserRole.COMMERCIAL}"`
        }]);
        return of(null);
      }
    ));
  }

  deleteUser(marketUuid: string, userLogin: string) {
    const utilities = this.utilitiesService.getUtilities();

    return this.http.delete<IMarketUser>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + marketUuid + '/user/' + userLogin, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  private getMarket(httpParams: HttpParams): Observable<IMarket[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<IMarket[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  suggestReferences(uuid: string, ref: string): Observable<BpuReference[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('reference', ref);
    return this.http.get<BpuReference[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid + '/references', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  suggestReferencesFromDesignation(uuid: string, designation: string): Observable<BpuReference[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('designation', designation);
    return this.http.get<BpuReference[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid + '/references', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAllComments(uuid: string): Observable<MarketComments[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.get<MarketComments[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/' + uuid + '/comments', {
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

  addComment(comment: MarketComments): Observable<MarketComments> {
    const utilities = this.utilitiesService.getUtilities();
    return this.http.post<MarketComments>(this.baseUrl + '/v1/' + utilities.organizationName + '/markets/comment', comment, {
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
}

export interface IMarket {
  uuid?: string;
  name?: string;
  marketNumber?: string;
  status?: string;
  tenant?: string;
  agency?: IAgency;
  receiveDate?: Date;
  responseDate?: Date;
  returnDate?: Date;
  startDate?: Date;
  duration?: number;
  publicationNumber?: string;
  customerRequirement?: CustomerRequirement;
  origin?: string;
  estimateVolume?: string;
  missionOrderType?: string;
  deadlineModality?: string;
  dunningModality?: string;
  interventionCondition?: string;
  specificReportNaming?: string;
  specificReportDisplay?: string;
  specificBilling?: string;
  missionOrderBillingLink?: string;
  billingFrequency?: string;
  warningPoint?: string;
  description?: string;
  bpu?: IBpu[];
  marketUsers?: IMarketUser[];
  marketEstablishments?: IMarketEstablishment[];
  marketPeoples?: IMarketPeople[];
  facturationAnalysis?: string;

  toString(): string;
}

export class Market implements IMarket {
  constructor(
    public uuid?: string,
    public name?: string,
    public marketNumber?: string,
    public status?: string,
    public tenant?: string,
    public agency?: IAgency,
    public receiveDate?: Date,
    public responseDate?: Date,
    public returnDate?: Date,
    public startDate?: Date,
    public duration?: number,
    public publicationNumber?: string,
    public customerRequirement?: CustomerRequirement,
    public origin?: string,
    public estimateVolume?: string,
    public missionOrderType?: string,
    public deadlineModality?: string,
    public dunningModality?: string,
    public interventionCondition?: string,
    public specificReportNaming?: string,
    public specificReportDisplay?: string,
    public specificBilling?: string,
    public missionOrderBillingLink?: string,
    public billingFrequency?: string,
    public warningPoint?: string,
    public description?: string,
    public bpu: IBpu[] = [],
    public marketUsers: IMarketUser[] = [],
    public marketEstablishments: IMarketEstablishment[] = [],
    public marketPeoples: IMarketPeople[] = [],
    public facturationAnalysis?: string
  ) {
  }

  static fromData(data: IMarket): Market {
    const {uuid, name, marketNumber, status, tenant, agency, receiveDate, responseDate, returnDate, startDate, duration, publicationNumber, customerRequirement, origin, estimateVolume, missionOrderType, deadlineModality, dunningModality, interventionCondition, specificReportNaming, specificReportDisplay, specificBilling, missionOrderBillingLink, billingFrequency, warningPoint, description, bpu, marketUsers, marketEstablishments, marketPeoples, facturationAnalysis} = data;
    return new this(
      uuid, name, marketNumber, status, tenant, Agency.fromData(agency), receiveDate, responseDate, returnDate, startDate, duration, publicationNumber, customerRequirement, origin, estimateVolume, missionOrderType, deadlineModality, dunningModality, interventionCondition, specificReportNaming, specificReportDisplay, specificBilling, missionOrderBillingLink, billingFrequency, warningPoint, description, bpu, marketUsers, marketEstablishments.map(ma => MarketEstablishment.fromData(ma)), marketPeoples.map(mp => MarketPeople.fromData(mp)), facturationAnalysis
    );
  }

  toString = (): string => {
    return this.name;
  }
}

export enum CustomerRequirement {
  DEMOLITION = 'Démolition',
  RENT = 'Location',
  UPDATE = 'Mise à jour',
  CONDOMINIUM = 'Mise en copropriété',
  REHABILITATION = 'Réhabilitation',
  WORK = 'Travaux',
  SELL = 'Vente',
  RELOCATION = 'Relocation'
}

export interface IBpu {
  uuid: string;
  file: string;
  tenant: string;
  marketId: string;
}

export class Bpu implements IBpu {
  constructor(
    public uuid: string,
    public file: string,
    public tenant: string,
    public marketId: string
  ) {
  }
}

export interface BpuReference {
  reference?: string;
  designation?: string;
  price: number;
}

export enum MarketAttachmentTypes {
  BPU = 'BPU'
}

export interface IMarketUser {
  market: IMarket;
  user: IUser;
  role: string;
}

export class MarketUser implements IMarketUser {
  constructor(
    public market: IMarket,
    public user: IUser,
    public role: string
  ) {
  }
}

export enum MarketUserRole {
  COMMERCIAL = 'Commercial Référent',
  TECHNICAL = 'RT Référent',
  ADMINISTRATIVE = 'Responsable administratif',
}

export interface IMarketPeople {
  market: IMarket;
  people: People;
  role: string;
}

export class MarketPeople implements IMarketPeople {
  constructor(
    public market: IMarket,
    public people: People,
    public role: string
  ) {
  }

  static fromData(data: IMarketPeople): MarketPeople {
    const {market, people, role} = data;
    return new this(market, PeopleUtils.buildPeople(people), role);
  }
}

export enum MarketPeopleRole {
  KEY = 'Contact principal',
  PURCHASER = 'Donneur d\'ordre / Apporteur d\'affaire',
  ACCOUNTING = 'Contact comptable',
  BILLING = 'Contact facturation',
  REPORT = 'Contact envoi de rapport'
}

export interface IMarketEstablishment {
  market: IMarket;
  establishment: Establishment;
  role: string;
}

export class MarketEstablishment implements IMarketEstablishment {
  constructor(
    public market: IMarket,
    public establishment: Establishment,
    public role: string
  ) {
  }

  static fromData(data: IMarketEstablishment): MarketEstablishment {
    const {market, establishment, role} = data;
    return new this(market, EstablishmentUtils.buildEstablishment(establishment), role);
  }
}

export enum MarketEstablishmentRole {
  CLIENT = 'Client',
  ADMINISTRATIVE_VALIDATOR = 'Validateur administratif',
  PURCHASER = 'Donneur d\'ordre / Apporteur d\'affaire',
  BILLED = 'Facturé',
  PAYER = 'Payeur'
}

export interface MarketComments {
  uuid?: string;
  idMarket: string;
  user: IUser;
  comment: string;
  created?: number;
}
