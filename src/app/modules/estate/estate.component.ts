import {Component, OnInit} from '@angular/core';
import {MenuStep, NavigationService} from "../../services/front/navigation.service";
import {ActivatedRoute, Router} from "@angular/router";
import {EstatesService, Estate} from "../../services/backend/estates.service";
import {AddressUtils} from "../utils/address-utils";
import {EstateUtils} from "../utils/estate-utils";
import {PeopleUtils} from "../utils/people-utils";
import {AccountUtils} from "../utils/account-utils";
import {InfoService} from "../../services/front/info.service";

@Component({
  selector: 'app-estate',
  templateUrl: './estate.component.html',
  styleUrls: ['./estate.component.scss']
})
export class EstateComponent implements OnInit {

  estate: Estate;
  accountName: string;
  nbPremises: number;
  nbAnnexes: number;
  nbAddresses: number;
  action = false;
  loading: boolean;
  workInProgress = false;

  constructor(private estatesService: EstatesService,
              private navigationService: NavigationService,
              private route: ActivatedRoute,
              private infoService: InfoService,
              protected router: Router) {
  }

  ngOnInit() {
    this.loading = true;
    this.navigationService.set({menu: MenuStep.ESTATES, url: this.router.url});
    this.route.params.subscribe(params => {
      this.estatesService.get(params.id).subscribe((estate) => {
        if (!estate) {
          console.log("An error occurred when retrieving estate " + params.id);
          this.loading = false;
        } else {
          this.estate = EstateUtils.buildEstate(estate);
          this.accountName = EstateUtils.getOwnerName(estate);
          this.nbPremises = 0;
          this.nbAnnexes = 0;
          this.nbAddresses = 0;
          this.estate.localities.forEach((e) => {
            this.nbPremises += e.premises.length;
            this.nbAnnexes += e.annexes.length;
            this.nbAddresses += e.addresses.length;
          });
          this.loading = false;
        }
      });
    });
  }

  getAddressName(estate: Estate) {
    return AddressUtils.getLocality(estate.localities[0].addresses[0]);
  }

  getStatusName(estate: Estate) {
    return EstateUtils.getStatusName(estate.state);
  }

  getStatusColor(estate: Estate) {
    return EstateUtils.getStatusColor(estate.state);
  }

  copyMessage(val: string): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.infoService.displayInfo('La référence du bien a été copié !');
  }
}
