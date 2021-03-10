import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {UtilitiesService} from './utilities.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {catchError} from 'rxjs/internal/operators';
import {User} from './users.service';

@Injectable()
export class InterventionCommentService {
  // @ts-ignore
  baseUrl = environment.missionsUrl || environment.orbitUrl;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
  }

  // GET           /v1/:orga/interventions/:id/comments                   api.v1.controllers.CommentController.listInterventionComments(orga, id)
  listInterventionComments(interventionId: string): Observable<Array<InterventionComment>> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<Array<InterventionComment>>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + interventionId + '/comments',
      {headers: utilities.headers}
    ).pipe(
      map(res => res),
      catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of([]);
      })
    );
  }

  // GET           /v1/:orga/interventions/:id/comments/last              api.v1.controllers.CommentController.getLastInterventionComment(orga, id)
  getLastInterventionComment(interventionId: string): Observable<InterventionComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<InterventionComment>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + interventionId + '/comments/last',
      {headers: utilities.headers}
    ).pipe(
      map(res => res),
      catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      })
    );
  }

  // GET           /v1/:orga/interventions/:id/comments/:commentId        api.v1.controllers.CommentController.getInterventionComment(orga, id, commentId)
  getInterventionComment(interventionId: string, commentId: string): Observable<InterventionComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<InterventionComment>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + interventionId + '/comments/' + commentId,
      {headers: utilities.headers}
    ).pipe(
      map(res => res),
      catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      })
    );
  }

  // POST          /v1/:orga/interventions/:id/comments                   api.v1.controllers.CommentController.addInterventionComment(request: Request, orga, id)
  addInterventionComment(commentForm: InterventionCommentForm): Observable<InterventionComment> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.post<InterventionCommentForm>(
      this.baseUrl + '/v1/' + utilities.organizationName + '/interventions/' + commentForm.idIntervention + '/comments/',
      commentForm,
      {headers: utilities.headers}
    ).pipe(
      map(commentId => commentId),
      catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      })
    );
  }
}

export interface InterventionComment {
  id: string;
  idIntervention: string;
  user: User;
  comment: string;
  date: number;
}

export interface InterventionCommentForm {
  idIntervention: string;
  idUser: string;
  comment: string;
}
