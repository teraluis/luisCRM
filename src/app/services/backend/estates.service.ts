import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {map} from 'rxjs/operators';
import {catchError} from 'rxjs/internal/operators';
import {Observable, of} from 'rxjs';
import {Account} from './accounts.service';
import {Address} from './addresses.service';
import {UUID} from '../../core/UUID';
import {People} from './people.service';
import {Establishment} from "./establishments.service";

@Injectable()
export class EstatesService {
  // @ts-ignore
  baseUrl = environment.estatesUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  getAll(): Observable<Estate[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as Estate[]);
      }
    ));
  }

  getPage(page: number, rows: number): Observable<Estate[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as Estate[]);
      }
    ));
  }

  getFromReference(reference: string): Observable<Estate[]> {
    const httpParams = new HttpParams().set('reference', reference);
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as Estate[]);
      }
    ));
  }

  getFromList(list: string[]): Observable<Estate[]> {
    const utilities = this.utilitiesService.getUtilities();
    const body = { estateList : list };
    return this.httpClient.post<Array<Estate>>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates/list', body, {
      headers: utilities.headers
    }).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }

  getFromEstablishment(establishmentId: string): Observable<Estate[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('establishment', establishmentId);
    return this.httpClient.get<Estate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }

  getFromAccount(accountId: string): Observable<Estate[]> {
    const utilities = this.utilitiesService.getUtilities();
    const httpParams = new HttpParams().set('account', accountId);
    return this.httpClient.get<Estate[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }

  get(id: string): Observable<Estate> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Estate>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates/full/' + id, {
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

  getLocality(id: string): Observable<Locality> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Locality>(this.baseUrl + '/v1/' + utilities.organizationName + '/localities/full/' + id, {
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

  getPremises(id: string): Observable<Premises> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Premises>(this.baseUrl + '/v1/' + utilities.organizationName + '/premises/full/' + id, {
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

  getAnnex(id: string): Observable<Annex> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Annex>(this.baseUrl + '/v1/' + utilities.organizationName + '/annexes/' + id, {
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

  add(estate: Estate): Observable<Estate> {
    const utilities = this.utilitiesService.getUtilities();
    const form: EstateForm = EstatesService.buildEstateForm(estate);
    return this.httpClient.post<Estate>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates', form, {
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

  addLocality(locality: Locality): Observable<Locality> {
    const utilities = this.utilitiesService.getUtilities();
    const form: LocalityForm = EstatesService.buildLocalityForm(locality);
    return this.httpClient.post<Locality>(this.baseUrl + '/v1/' + utilities.organizationName + '/localities', form, {
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

  addPremises(premises: Premises): Observable<Premises> {
    const utilities = this.utilitiesService.getUtilities();
    const form: PremisesForm = EstatesService.buildPremisesForm(premises);
    return this.httpClient.post<Premises>(this.baseUrl + '/v1/' + utilities.organizationName + '/premises', form, {
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

  addAnnex(annex: Annex): Observable<Annex> {
    const utilities = this.utilitiesService.getUtilities();
    const form: AnnexForm = EstatesService.buildAnnexForm(annex);
    return this.httpClient.post<Annex>(this.baseUrl + '/v1/' + utilities.organizationName + '/annexes', form, {
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

  update(estate: Estate): Observable<Estate> {
    const utilities = this.utilitiesService.getUtilities();
    const form: EstateForm = EstatesService.buildEstateForm(estate);
    return this.httpClient.patch<Estate>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates/' + estate.id, form, {
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

  updateLocality(locality: Locality): Observable<Locality> {
    const utilities = this.utilitiesService.getUtilities();
    const form: LocalityForm = EstatesService.buildLocalityForm(locality);
    return this.httpClient.patch<Locality>(this.baseUrl + '/v1/' + utilities.organizationName + '/localities', form, {
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

  updatePremises(premises: Premises): Observable<Premises> {
    const utilities = this.utilitiesService.getUtilities();
    const form: PremisesForm = EstatesService.buildPremisesForm(premises);
    return this.httpClient.patch<Premises>(this.baseUrl + '/v1/' + utilities.organizationName + '/premises', form, {
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

  updateAnnex(annex: Annex): Observable<Annex> {
    const utilities = this.utilitiesService.getUtilities();
    const form: AnnexForm = EstatesService.buildAnnexForm(annex);
    return this.httpClient.patch<Annex>(this.baseUrl + '/v1/' + utilities.organizationName + '/annexes', form, {
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

  deleteLocality(localityId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/localities/' + localityId, {
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

  deletePremises(premisesId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/premises/' + premisesId, {
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

  deleteAnnex(annexId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/annexes/' + annexId, {
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

  listEstateTypes(): Observable<IdType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IdType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/estate', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as IdType[]);
      }
    ));
  }

  getEstateType(id: string): Observable<IdType> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IdType>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/estate/' + id, {
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

  listHeatingTypes(): Observable<IdType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IdType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/heating', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as IdType[]);
      }
    ));
  }

  listPremisesTypes(): Observable<IdType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IdType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/premises', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as IdType[]);
      }
    ));
  }

  listAnnexTypes(): Observable<IdType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IdType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/annex', {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([] as IdType[]);
      }
    ));
  }

  // FIXME: should returns a list of file
  listAttachment(estateId: string): Observable<Blob[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/estates/' + estateId + '/attachments', {
      headers: utilities.headers,
      observe: 'response',
      responseType: 'blob'
    }).pipe(map(
      (resp) => {
        return new Blob([resp.body], {type: 'octet/stream'});
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addAttachment(estateId: string, file: File): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    const headers = utilities.headers.append('Content-type', file.type);
    const httpParams = new HttpParams().set('filename', file.name);
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/estates/' + estateId + '/attachments', file, {
      params: httpParams,
      headers: headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  deleteAttachment(attachmentId: string): Observable<boolean> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/' + attachmentId, {
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

  getAttachment(attachmentId: string, name: string): Observable<Blob> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get(this.baseUrl + '/v1/' + utilities.organizationName + '/attachments/' + attachmentId, {
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

  listAllTypes(): Observable<AllEstateTypes> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<AllEstateTypes>(this.baseUrl + '/v1/' + utilities.organizationName + '/types/all', {
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

  private static buildEstateForm(estate: Estate): EstateForm {
    return {
      id: estate.id || null,
      adxReference: estate.adxReference,
      name: estate.name,
      estateReference: estate.estateReference || null,
      estateTypeId: estate.estateType.id,
      customEstateType: estate.customEstateType || null,
      establishmentId: estate.establishment ? estate.establishment.uuid : null,
      accountId: estate.account.uuid,
      state: estate.state,
      localities: estate.localities.map(value => this.buildLocalityForm(value)),
      attachments: estate.attachments,
      deleted: estate.deleted
    };
  }

  private static buildLocalityForm(locality: Locality): LocalityForm {
    if (isNaN(Number(locality.constructionDate))) {
      locality.constructionDate = new Date(locality.constructionDate).getTime();
    }
    if (isNaN(Number(locality.buildingPermitDate))) {
      locality.buildingPermitDate = new Date(locality.buildingPermitDate).getTime();
    }
    return {
      id: locality.id || null,
      name: locality.name,
      floorQ: locality.floorQ || null,
      cadastralReference: locality.cadastralReference || null,
      buildingPermitDate: locality.buildingPermitDate || null,
      constructionDate: locality.constructionDate || null,
      condominium: locality.condominium || null,
      inseeCoordinates: locality.inseeCoordinates || null,
      heatingTypeId: locality.heatingType ? locality.heatingType.id : null,
      customHeatingType: locality.customHeatingType || null,
      addresses: locality.addresses.map(a => a.uuid),
      premises: locality.premises.map(value => this.buildPremisesForm(value)),
      annexes: locality.annexes ? locality.annexes.map(value => this.buildAnnexForm(value)) : [],
      deleted: locality.deleted
    };
  }

  private static buildPremisesForm(premises: Premises): PremisesForm {
    if (isNaN(Number(premises.releaseDate))) {
      premises.releaseDate = new Date(premises.releaseDate).getTime();
    }
    return {
      id: premises.id || null,
      number: premises.number,
      floor: premises.floor || null,
      area: premises.area || null,
      releaseDate: premises.releaseDate || null,
      premisesTypeId: premises.premisesType.id,
      customPremisesType: premises.customPremisesType || null,
      idContact: premises.contact ? premises.contact.uuid : null,
      heatingTypeId: premises.heatingType ? premises.heatingType.id : null,
      customHeatingType: premises.customHeatingType || null,
      premisesReference: premises.premisesReference || null,
      deleted: premises.deleted
    };
  }

  private static buildAnnexForm(annex: Annex): AnnexForm {
    return {
      id: annex.id || null,
      floor: annex.floor || null,
      area: annex.area || null,
      isCommonArea: annex.isCommonArea,
      annexTypeId: annex.annexType ? annex.annexType.id : null,
      customAnnexType: annex.customAnnexType || null,
      annexReference: annex.annexReference || null,
      deleted: annex.deleted
    };
  }
}

export interface IdType {
  id: string;
  type: string;
  deleted: boolean;
}

export interface Estate {
  id?: string;
  adxReference: string;
  name: string;
  estateReference?: string;
  estateType: IdType;
  customEstateType?: string;
  establishment?: Establishment;
  account: Account;
  state: EstateState;
  localities: Locality[];
  attachments: EstateAttachment[];
  deleted: boolean;
}

export interface Locality {
  id?: string;
  name: string;
  floorQ?: number; /* floor quantity */
  cadastralReference?: string;
  buildingPermitDate?: number;
  constructionDate?: number;
  condominium?: boolean;
  inseeCoordinates?: string;
  creationDate: number;
  heatingType?: IdType;
  customHeatingType?: string;
  addresses: Address[];
  premises: Premises[];
  annexes: Annex[];
  localityReference?: string;
  deleted: boolean;
}

export interface Premises {
  id?: string;
  number: string;
  floor?: string;
  area?: number;
  releaseDate?: number;
  premisesType: IdType;
  customPremisesType?: string;
  contact?: People;
  heatingType?: IdType;
  customHeatingType?: string;
  premisesReference?: string;
  deleted: boolean;
}

export interface Annex {
  id?: string;
  floor?: string;
  area?: number;
  isCommonArea: boolean;
  annexType?: IdType;
  customAnnexType?: string;
  annexReference?: string;
  heatingType?: IdType;
  customHeatingType?: string;
  deleted: boolean;
}

export interface EstateAttachment {
  id: string;
  file: string;
}

export enum EstateState {
  INACTIVE,
  ACTIVE,
  INCOMPLETE,
  COMPLETE
}

export enum EstateAttachmentType {
  MAP = 'Plan du bien'
}

export interface AllEstateTypes {
  estate: IdType[];
  heating: IdType[];
  premises: IdType[];
  annex: IdType[];
}

// Used only by this service
interface EstateForm {
  id?: string;
  adxReference: string;
  name: string;
  estateReference?: string;
  estateTypeId: string;
  customEstateType?: string;
  establishmentId?: string;
  accountId: string;
  state?: EstateState;
  localities: LocalityForm[];
  attachments: EstateAttachment[];
  deleted: boolean;
}

interface LocalityForm {
  id?: string;
  name: string;
  floorQ?: number; /* floor quantity */
  cadastralReference?: string;
  buildingPermitDate?: number;
  constructionDate?: number;
  condominium?: boolean;
  inseeCoordinates?: string;
  heatingTypeId?: string;
  customHeatingType?: string;
  addresses: string[];
  premises: PremisesForm[];
  annexes: AnnexForm[];
  deleted: boolean;
}

interface PremisesForm {
  id?: string;
  number: string;
  floor?: string;
  area?: number;
  releaseDate?: number;
  premisesTypeId: string;
  customPremisesType?: string;
  idContact?: string;
  heatingTypeId?: string;
  customHeatingType?: string;
  premisesReference?: string;
  deleted: boolean;
}

interface AnnexForm {
  id?: string;
  floor?: string;
  area?: number;
  isCommonArea: boolean;
  annexTypeId?: string;
  customAnnexType?: string;
  annexReference?: string;
  deleted: boolean;
}
