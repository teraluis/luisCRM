import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {LoginResult, LoginService} from '../../services/backend/login.service';
import {OrganizationsService} from '../../services/backend/organizations.service';
import {MarketsService} from '../../services/backend/markets.service';
import {PrestationsService} from '../../services/backend/prestations.service';
import {InfoService} from '../../services/front/info.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string;
  loading = false;
  returnUrl: string;

  constructor(
    private httpClient: HttpClient,
    private loginService: LoginService,
    private organizationsService: OrganizationsService,
    private marketService: MarketsService,
    private prestationsService: PrestationsService,
    private router: Router,
    private route: ActivatedRoute,
    private infoService: InfoService) {
  }

  ngOnInit() {
    this.username = '';
    this.password = '';
    this.returnUrl = '/';
  }

  login() {
    this.loading = true;
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';

    if (!this.username || this.username === '') {
      this.loading = false;
      this.infoService.displayError('Veuillez entrer vos identifiants.', null, 4000, false);
    } else if (!this.password || this.password === '') {
      this.loading = false;
      this.infoService.displayError('Veuillez entrer votre mot de passe.', null, 4000, false);
    } else {
      this.loginService.login(this.username, this.password).subscribe((result: LoginResult) => {
        this.loading = false;
        if (result.accessGranted) {
          const token: string = localStorage.getItem('token');
          this.organizationsService.getOrganization(token).subscribe((bool) => {
            if (bool) {
              this.organizationsService.getPrivileges().subscribe((bool2) => {
                if (bool2) {
                  this.marketService.getSingleMarket().subscribe((market) => {
                    if (!market) {
                      console.log('Missing single market.');
                      localStorage.clear();
                      this.infoService.displayError('Un problème technique est survenu.', 'Merci de nous remonter le bug et veuillez réessayer ultérieurement.', 4000, false);
                    } else {
                      localStorage.setItem('marketuuid', market.uuid);
                      this.router.navigateByUrl(this.returnUrl);
                    }
                  });
                } else {
                  console.log('Error when getting privileges');
                  localStorage.clear();
                }
              });
            }
          });
        } else {
          this.loading = false;
          localStorage.clear();
          this.infoService.displayError(result.errorMessage1, result.errorMessage2, 4000, false);
        }
      });
    }
  }

}

export interface Token {
  token: string;
}
