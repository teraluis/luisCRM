import {Injectable} from "@angular/core";
import {AbstractService} from "../../core/datagrid";
import {NewIndividual} from "../../modules/individuals/new-individual";
import {Observable, of} from "rxjs";
import {catchError} from "rxjs/internal/operators";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {UtilitiesService} from "./utilities.service";

@Injectable({providedIn: 'root'})
export class IndividualService extends AbstractService<NewIndividual> {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient,
              private utilitiesService: UtilitiesService) {
    super();
  }

  get(filter, sort, pageIndex, pageSize): Observable<{ data: NewIndividual[]; total: number }> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<{ data: NewIndividual[]; total: number }>(this.baseUrl + '/v1/ADX/accounts/individuals/overviews',
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
