import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {UtilitiesService} from "./utilities.service";
import {Observable, of} from "rxjs";
import {Prestation, PrestationEstateType} from "./prestations.service";
import {map} from "rxjs/operators";
import {catchError} from "rxjs/internal/operators";
import {UUID} from "../../core/UUID";


@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) { }

  getAll(): Observable<Product[]> {
    const httpParams = new HttpParams();
    return this.buildGetFromRequest(httpParams);
  }

  getPage(page: number, rows: number): Observable<Product[]> {
    const httpParams = new HttpParams().set('page', page.toString()).set('rows', rows.toString());
    return this.getProduct(httpParams);
  }

  add(product: AProduct): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<UUID>(this.baseUrl + '/v1/' + utilities.organizationName + '/products', product, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  update(product: AProduct): Observable<Product> {
    const utilities = this.utilitiesService.getUtilities();

    return this.httpClient.patch<Product>(this.baseUrl + '/v1/' + utilities.organizationName + '/products/' + product.uuid, product, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }
  private buildGetFromRequest(httpParams: HttpParams): Observable<Product[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Prestation[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/products', {
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

  private getProduct(httpParams: HttpParams): Observable<Product[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Product[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/products', {
      params: httpParams,
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      }
    ));
  }

  delete(uuid: string): Observable<any> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.delete<Product>(this.baseUrl + '/v1/' + utilities.organizationName + '/products/' + uuid, {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAllProductTypes(): Observable<ProductType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<ProductType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/product-type', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  getAllSurfaceTypes(): Observable<SurfaceType[]> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<SurfaceType[]>(this.baseUrl + '/v1/' + utilities.organizationName + '/surface-type', {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addProductType(product: string): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post(this.baseUrl + '/v1/' + utilities.organizationName + '/product-type/' + product, "", {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  addSurfaceType(surface: string): Observable<UUID> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post(this.baseUrl + '/v1/' + utilities.organizationName + '/surface-type/' + surface, "", {
      headers: utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }
}

export interface Product {
  uuid: string;
  prestationCode: string;
  description: string;
  validity: boolean;
  surfaceType: string;
  productType: string;
  businessCode: string;
  webActive: boolean;
  jobRank: string;
  equipment: string;
  comment: string;
  targetId: string;
  offerCode: string;
  fieldCode: string;
}

export class AProduct implements Product {
  constructor(
    public uuid: string,
    public businessCode: string,
    public comment: string,
    public description: string,
    public fieldCode: string,
    public equipment: string,
    public jobRank: string,
    public offerCode: string,
    public prestationCode: string,
    public productType: string,
    public surfaceType: string,
    public targetId: string,
    public validity: boolean,
    public webActive: boolean
  ) {
  }
}

export interface ProductType {
  id: string;
  label: string;
}

export interface SurfaceType {
  id: string;
  label: string;
}
