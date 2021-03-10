import {Component} from "@angular/core";
import {Estate, EstatesService, Locality} from "../../services/backend/estates.service";
import {EstateUtils} from "../utils/estate-utils";
import {People} from "../../services/backend/people.service";
import {MatDialogRef} from "@angular/material/dialog";
import {PeopleUtils} from "../utils/people-utils";
import {AddressUtils} from "../utils/address-utils";
import {FormControl} from "@angular/forms";
import {IndexableLocality, IndexName, SearchService} from "../../services/backend/search.service";
import {switchMap} from "rxjs/operators";
import {of} from "rxjs";

@Component({
  selector: 'app-estate-search-dialog',
  templateUrl: './estate-search-dialog.component.html',
  styleUrls: ['./estate-search-dialog.component.scss']
})
export class EstateSearchDialogComponent {

  loading: boolean;
  filterField: string;
  suggestedEstate: Estate[];
  selectedEstate: Estate;
  noResult = false;
  firstSearchDone = false;
  search: FormControl;
  orderedList: string[];

  constructor(public dialogRef: MatDialogRef<EstateSearchDialogComponent>,
              private estatesService: EstatesService,
              private searchService: SearchService) {
  }

  searchEstate() {
    if (this.filterField && this.filterField.length > 1) {
      this.loading = true;
      this.estatesService.getFromReference(this.filterField).subscribe((estates) => {
        if (estates && estates.length > 0) {
          const tmp: Estate[] = [];
          estates.forEach((e) => {
            if (!tmp.map(t => t.id).includes(e.id)) {
              tmp.push(e);
            }
          });
          this.orderedList = tmp.map(t => t.id);
          this.setEstates(tmp);
        } else {
          this.searchService.search(this.filterField, IndexName.LOCALITIES)
            .pipe(switchMap(resp => {
              const tmp: string[] = [];
              resp.filter(r => !!(r as IndexableLocality).estateId).map(r => (r as IndexableLocality).estateId).forEach((e) => {
                if (!tmp.includes(e)) {
                  tmp.push(e);
                }
              });
              this.orderedList = tmp.slice(0, 7);
              return this.orderedList.length > 0 ? this.estatesService.getFromList(this.orderedList) : of([]);
            })).subscribe(results => this.setEstates(results));
        }
      });
    } else {
      this.suggestedEstate = [];
      this.loading = false;
    }
  }

  setEstates(estates: Estate[]) {
    this.suggestedEstate = [];
    // Re-order suggestedEstate by elastic search score
    estates.forEach((estate) => this.suggestedEstate[this.orderedList.indexOf(estate.id)] = estate);
    // Sort sub-element of suggestedEstate
    this.suggestedEstate.forEach((estate) => {
      estate.localities.sort((a, b) => b.creationDate - a.creationDate);
      estate.localities.forEach((locality) => {
        locality.annexes.sort((a, b) => EstateUtils.sortByFloor(a, b));
        locality.premises.sort((a, b) => EstateUtils.sortByFloor(a, b));
      });
    });
    this.noResult = !estates || estates.length === 0;
    this.firstSearchDone = true;
    this.loading = false;
  }

  validateEstate(estate?: Estate) {
    this.dialogRef.close(EstateUtils.buildEstate(estate));
  }

  isSelected(estate: Estate) {
    return this.selectedEstate && this.selectedEstate.id === estate.id;
  }

  getEstateIcon(estate: Estate) {
    return EstateUtils.getEstateIcon(estate);
  }

  getPremisesLabel(estate: Estate, plural?: boolean) {
    return EstateUtils.getPremisesLabel(estate, plural);
  }

  getLocalityAddress(locality: Locality) {
    return AddressUtils.getFullName(locality.addresses[0]);
  }

  getOwnerName(estate: Estate) {
    return EstateUtils.getOwnerName(estate);
  }

  getContactName(contact: People) {
    return PeopleUtils.getName(contact);
  }

  getNbPremises(localities: Locality[]) {
    let nbPremises = 0;
    localities.forEach((loc) => {
      nbPremises = nbPremises + loc.premises.length;
    });
    return nbPremises;
  }

  getNbAnnexes(localities: Locality[]) {
    let nbAnnexes = 0;
    localities.forEach((loc) => {
      nbAnnexes = nbAnnexes + loc.premises.length;
    });
    return nbAnnexes;
  }
}
