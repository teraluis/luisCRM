import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {catchError} from 'rxjs/operators';

@Injectable()
export class SearchService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  search(query: string, indexName?: IndexName): Observable<Array<IndexableObject>> {
    const utilities = this.utilitiesService.getUtilities();
    const body = { query : query };
    let dest;
    switch (indexName) {
      case IndexName.INTERVENTIONS:
        dest = 'mission';
        break;
      case IndexName.ORDERS:
      case IndexName.PROFESSIONALS:
      case IndexName.ESTABLISHMENTS:
      case IndexName.INDIVIDUALS:
        dest = 'crm';
        break;
      case IndexName.LOCALITIES:
        dest = 'estate';
        break;
      default:
        indexName = IndexName.ALL;
        dest = 'crm';
        break;
    }
    return this.httpClient.post<Array<IndexableObject>>(this.baseUrl + '/v1/' + utilities.organizationName + '/' + dest + '/search/' + indexName, JSON.stringify(body), {
      headers: utilities.headers
    }).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }

  reIndex(indexName: string): Observable<any> {
    const utilities = this.utilitiesService.getUtilities();
    let dest;
    switch (indexName) {
      case IndexName.INTERVENTIONS:
        dest = 'mission';
        break;
      case IndexName.ORDERS:
      case IndexName.PROFESSIONALS:
      case IndexName.ESTABLISHMENTS:
      case IndexName.INDIVIDUALS:
        dest = 'crm';
        break;
      case IndexName.LOCALITIES:
        dest = 'estate';
        break;
      default:
        return of([]);
    }
    return this.httpClient.get<any>(this.baseUrl + '/v1/' + utilities.organizationName + '/' + dest + '/search/reindex/' + indexName, {
      headers: utilities.headers
    }).pipe(
      catchError((error: HttpErrorResponse) => {
          this.utilitiesService.handleError(error);
          return of([]);
        }
      ));
  }
}

export enum IndexName {
  ALL = '*',
  ORDERS = 'orders',
  PROFESSIONALS = 'professionals',
  ESTABLISHMENTS = 'establishments',
  INDIVIDUALS = 'individuals',
  INTERVENTIONS = 'interventions',
  LOCALITIES = 'localities'
}

export interface IndexableObject {
  id: string;
  type: string;
  typeLabel: string;
}

export interface IndexableOrder extends IndexableObject {
  name: string;
  status: string;
  created: string;
  purchaser: {id: string, name: string};
  description?: string;
  referenceNumber?: string;
  account?: {id: string, name: string};
  market?: {id: string, name: string};
}

export interface IndexableProfessional extends IndexableObject {
  name: string;
  category: string;
  accountType: string;
  status?: string;
  created: string;
  people: {id: string, name: string, phone: string};
  address?: string;
  commercial?: {id: string, name: string};
  entity?: {id: string, name: string, siren: string};
}

export interface IndexableEstablishment extends IndexableObject {
  name: string;
  corporateName: string;
  siret: string;
  created: string;
  entity: {id: string, name: string};
  people?: {id: string, name: string, phone: string};
  description?: string;
  activity?: string;
  address?: string;
  phone?: string;
  mail?: string;
}

export interface IndexableIndividual extends IndexableObject {
  name: string;
  category: string;
  accountType: string;
  status?: string;
  created: string;
  people: {id: string, name: string, phone: string};
  address?: string;
  commercial?: {id: string, name: string};
}

export interface IndexableIntervention extends IndexableObject {
  name: string;
  status: string;
  created: string;
  estate?: {id: string, name: string, address: string};
  order?: {id: string, name: string};
  account?: {id: string, name: string};
}


export interface IndexableLocality extends IndexableObject {
  estateId: string;
  name: string;
  address: string;
  cadastralReference: string;
  nbPremises: number;
  nbAnnexes: number;
  created: string;
  localityReference: string; // TODO display this field in search results
}
