import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {SearchbarService} from '../../services/front/searchbar.service';
import {LockService} from '../../services/front/lock.service';
import {NavigationService} from '../../services/front/navigation.service';
import {
  IndexableProfessional, IndexableIntervention, IndexableOrder, IndexName,
  SearchService, IndexableEstablishment, IndexableIndividual, IndexableObject, IndexableLocality
} from '../../services/backend/search.service';
import {Subject} from 'rxjs';
import {debounceTime, map, mergeMap} from 'rxjs/operators';
import {InterventionUtils} from "../utils/intervention-utils";
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-topbar-component',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, AfterViewInit {

  searchValue: string;
  lock = false;

  @ViewChild('dropdown') dropdown;
  @ViewChild('searchBar') searchBar;

  constructor(private router: Router,
              private navigationService: NavigationService,
              private searchbarService: SearchbarService,
              private lockService: LockService,
              private searchService: SearchService,
              protected dialog: MatDialog) {
    console.log('Topbar component loaded.');
  }

  public allOrderResults: Array<IndexableOrder> = [];
  public allInterventionResults: Array<IndexableIntervention> = [];
  public allProfessionalResults: Array<IndexableProfessional> = [];
  public allEstablishmentResults: Array<IndexableEstablishment> = [];
  public allIndividualResults: Array<IndexableIndividual> = [];
  public allLocalityResults: Array<IndexableLocality> = [];
  public orderResults: Array<IndexableOrder> = [];
  public interventionResults: Array<IndexableIntervention> = [];
  public professionalResults: Array<IndexableProfessional> = [];
  public establishmentResults: Array<IndexableEstablishment> = [];
  public individualResults: Array<IndexableIndividual> = [];
  public localityResults: Array<IndexableLocality> = [];

  displayOrder = false;
  displayIntervention = false;
  displayProfessional = false;
  displayEstablishment = false;
  displayIndividual = false;
  displayLocality = false;

  ngOnInit() {

    this.lockService.lockSubject.asObservable().subscribe((lock) => {
      this.lock = lock !== null;
    });

    this.searchSubject.asObservable()
      .pipe(debounceTime(300))
      .pipe(mergeMap(query => {
        this.dropdownLoading = true;
        return this.searchService.search(query).pipe(map(results => {
          this.allOrderResults = [];
          this.allInterventionResults = [];
          this.allProfessionalResults = [];
          this.allEstablishmentResults = [];
          this.allIndividualResults = [];
          this.allLocalityResults = [];
          results.forEach(result => {
            if (result.type === 'order') {
              this.allOrderResults.push(result as IndexableOrder);
            } else if (result.type === 'intervention') {
              this.allInterventionResults.push(result as IndexableIntervention);
            } else if (result.type === 'professional') {
              this.allProfessionalResults.push(result as IndexableProfessional);
            } else if (result.type === 'establishment') {
              this.allEstablishmentResults.push(result as IndexableEstablishment);
            } else if (result.type === 'individual') {
              this.allIndividualResults.push(result as IndexableIndividual);
            } else if (result.type === 'locality' && !!(result as IndexableLocality).estateId) { // Do not take unlinked localities
              this.allLocalityResults.push(result as IndexableLocality);
            }
          });
          this.setDisplayedData();
        }));
      })).subscribe(osef => {
      this.dropdownLoading = false;
    });
  }

  ngAfterViewInit() {
    this.resizeDropdown();
  }

  setDisplayedData() {
    if (!this.displayOrder && !this.displayIntervention && !this.displayProfessional
      && !this.displayEstablishment && !this.displayIndividual && !this.displayLocality) {
      this.orderResults = this.allOrderResults.slice(0, 3);
      this.interventionResults = this.allInterventionResults.slice(0, 3);
      this.professionalResults = this.allProfessionalResults.slice(0, 3);
      this.establishmentResults = this.allEstablishmentResults.slice(0, 3);
      this.individualResults = this.allIndividualResults.slice(0, 3);
      this.localityResults = this.allLocalityResults.slice(0, 3);
    } else {
      this.orderResults = [];
      this.interventionResults = [];
      this.professionalResults = [];
      this.establishmentResults = [];
      this.individualResults = [];
      this.localityResults = [];
      if (this.displayOrder) {
        this.orderResults = this.allOrderResults;
      } else if (this.displayIntervention) {
        this.interventionResults = this.allInterventionResults;
      } else if (this.displayProfessional) {
        this.professionalResults = this.allProfessionalResults;
      } else if (this.displayEstablishment) {
        this.establishmentResults = this.allEstablishmentResults;
      } else if (this.displayIndividual) {
        this.individualResults = this.allIndividualResults;
      } else if (this.displayLocality) {
        this.localityResults = this.allLocalityResults;
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resizeDropdown();
  }

  protected resizeDropdown() {
    this.dropdown.nativeElement.style.left = this.searchBar.nativeElement.offsetLeft + "px";
    this.dropdown.nativeElement.style.top = (this.searchBar.nativeElement.offsetTop + 45) + "px";
  }

  @HostListener('document:click', ['$event.target'])
  public onClickOutside(targetElement) {
    const clickedInside = this.dropdown.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.dropdownOpened = false;
    }
  }

  goToDetail(element: IndexableObject) {
    this.dropdownOpened = false;
    let redirection: string[];
    switch (element.type) {
      case 'order':
        redirection = ['/orders', element.id];
        break;
      case 'intervention':
        const intervention = element as IndexableIntervention;
        redirection = ['/interventions', intervention.id, 'orders', intervention.order.id];
        break;
      case 'professional':
        redirection = ['/comptes', element.id];
        break;
      case 'establishment':
        redirection = ['/establishments', element.id];
        break;
      case 'individual':
        redirection = ['/individuals', element.id];
        break;
      case 'locality':
        const locality = element as IndexableLocality;
        redirection = ['/estates', locality.estateId];
        break;
      default:
        break;
    }
    if (redirection) {
      this.router.navigate(redirection);
    }
  }

  setSearchBar() {
    this.searchbarService.setSearchbar(this.searchValue);
  }

  protected searchSubject = new Subject<string>();

  search(value: string) {
    if (value && value.trim().length > 0) {
      this.dropdownOpened = true;
      this.searchSubject.next(value);
    } else {
      this.dropdownOpened = false;
    }
  }

  dropdownLoading = false;

  dropdownOpened = false;
  hideDropDown() {
    this.dropdownOpened = false;
  }

  validate() {

  }

  logout() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Déconnexion',
        text: 'Êtes-vous sûr de vouloir vous déconnecter ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });


  }

  reIndex() {
    /*this.searchService.reIndex(IndexName.ORDERS).subscribe((resp1) => {
      console.log("Re-index orders ES done.");
      console.log("resp: ", resp1);
      this.searchService.reIndex(IndexName.PROFESSIONALS).subscribe((resp2) => {
        console.log("Re-index accounts ES done.");
        console.log("resp: ", resp2);
        this.searchService.reIndex(IndexName.ESTABLISHMENTS).subscribe((resp3) => {
          console.log("Re-index accounts ES done.");
          console.log("resp: ", resp3);
          this.searchService.reIndex(IndexName.INTERVENTIONS).subscribe((resp4) => {
            console.log("Re-index interventions ES done.");
            console.log("resp: ", resp4);
            this.searchService.reIndex(IndexName.LOCALITIES).subscribe((resp5) => {
              console.log("Re-index localities ES done.");
              console.log("resp: ", resp5);
              this.searchService.search('La').subscribe((test) => {
                console.log("test: ", test);
              });
            });
          });
        });
      });
    });*/
  }

  showOrder() {
    if (this.allOrderResults.length > 3) {
      this.displayOrder = !this.displayOrder;
      this.setDisplayedData();
    }
  }

  showIntervention() {
    if (this.allInterventionResults.length > 3) {
      this.displayIntervention = !this.displayIntervention;
      this.setDisplayedData();
    }
  }

  showProfessional() {
    if (this.allProfessionalResults.length > 3) {
      this.displayProfessional = !this.displayProfessional;
      this.setDisplayedData();
    }
  }

  showEstablishment() {
    if (this.allEstablishmentResults.length > 3) {
      this.displayEstablishment = !this.displayEstablishment;
      this.setDisplayedData();
    }
  }

  showIndividual() {
    if (this.allIndividualResults.length > 3) {
      this.displayIndividual = !this.displayIndividual;
      this.setDisplayedData();
    }
  }

  showLocality() {
    if (this.allLocalityResults.length > 3) {
      this.displayLocality = !this.displayLocality;
      this.setDisplayedData();
    }
  }

  getInterventionStatus(status: string) {
    return InterventionUtils.getStatusName(InterventionUtils.getStatusFromLabel(status));
  }
}
