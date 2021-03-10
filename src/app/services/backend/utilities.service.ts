import {Injectable} from '@angular/core';
import {Organization} from './organizations.service';
import {HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {InfoService} from '../front/info.service';
import {Router} from '@angular/router';

@Injectable()
export class UtilitiesService {
  constructor(protected router: Router, protected infoService: InfoService) {
  }

  getUtilities(): RequestUtilities {
    const token: string = localStorage.getItem('token');
    const organization: Organization = JSON.parse(localStorage.getItem('organization'));
    const headers = new HttpHeaders({
      user_token: token,
      organization: organization.uuid
    });
    return new RequestUtilities(organization.name, headers);
  }

  handleError(error: HttpErrorResponse, message?: { status: number, content: string }[], duration: number = 4000, clickable: boolean = true) {
    if (error.status === 401) {
      localStorage.clear();
      this.infoService.displayError('Votre token a expiré. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      console.error(error);
      this.infoService.displayError(
        message && message.find(m => m.status === error.status) ?
          message.find(m => m.status === error.status).content : 'Opération non permise'
      );
    } else {
      console.log(error);
      this.infoService.displayError('Un problème technique est survenu.', 'Merci de nous remonter le bug via le module de conversation pour le corriger rapidement.', duration, clickable);
    }
  }

}

export class RequestUtilities {
  organizationName: string;
  headers: HttpHeaders;

  constructor(organizationName: string, headers: HttpHeaders) {
    this.organizationName = organizationName;
    this.headers = headers;
  }
}
