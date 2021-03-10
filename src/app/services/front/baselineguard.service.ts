import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {InfoService} from './info.service';
import {AuthGuard} from './authguard.service';
import {ManagementRights} from '../../core/rights/ManagementRights';

@Injectable({
  providedIn: 'root',
})
export class BaselineGuard implements CanActivate {

  userRights: ManagementRights = new ManagementRights();

  constructor(private router: Router, private infoService: InfoService, private authGuard: AuthGuard) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const result = this.authGuard.canActivate(route, state);
    if (!result) {
      return false;
    } else {
      if (this.userRights.baseline) {
        return true;
      } else {
        this.router.navigate(['not-found']);
      }
    }
  }

}
