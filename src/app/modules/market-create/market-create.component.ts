import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {People, PeopleService} from '../../services/backend/people.service';
import {CustomerRequirement, IMarket, Market, MarketEstablishment, MarketEstablishmentRole, MarketPeople, MarketPeopleRole, MarketsService, MarketUser, MarketUserRole} from '../../services/backend/markets.service';
import {Agency, AgencyService, IAgency} from '../../services/backend/agency.service';
import {IUser, User, UsersService} from '../../services/backend/users.service';
import {AuthGuard} from '../../services/front/authguard.service';
import {entityValidator} from "../../core/validators/entity-validator.directive";
import {PeopleUtils} from "../utils/people-utils";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {EstablishmentsService, FullEstablishment} from '../../services/backend/establishments.service';
import {FacturationAnalysis} from '../../services/backend/establishments.service';

@Component({
  selector: 'app-market-create',
  templateUrl: 'market-create.component.html'
})
export class MarketCreateComponent implements OnInit {

  @Input() data: MarketCreateData;

  @Output() marketSaved = new EventEmitter<IMarket>();
  @Output() removeMarket = new EventEmitter<IMarket>();
  @Output() cancelAction = new EventEmitter<void>();

  isLoading = false;
  marketForm: FormGroup;
  establishmentSelected = false;
  selectedEstablishment: FullEstablishment;
  facturationAnalysis: string[] = Object.values(FacturationAnalysis);
  selectedPeople: People;
  suggestedEstablishments: FullEstablishment[] = [];
  suggestedPeoples: People[] = [];
  suggestedAgencies: IAgency[] = [];
  suggestedUsers: IUser[] = [];
  customRequirements = Object.values(CustomerRequirement);
  saving = false;

  constructor(
    private fb: FormBuilder,
    private establishmentService: EstablishmentsService,
    private peopleService: PeopleService,
    private marketService: MarketsService,
    private agencyService: AgencyService,
    private userService: UsersService,
    private authGuard: AuthGuard
  ) {
  }

  ngOnInit() {
    this.initialize();
    this.marketForm.get('client').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.establishmentService.searchForOrder(val))
      )
      .subscribe((establishments) => {
        this.suggestedEstablishments = establishments;
      });

    this.marketForm.get('keyContact').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.peopleService.suggestAll(val))
      )
      .subscribe((peoples) => {
        this.suggestedPeoples = peoples;
      });

    this.marketForm.get('agency').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.agencyService.search(val) as unknown as Observable<IAgency[]>),
        map(agencies => agencies.map(agency => Agency.fromData(agency)))
      )
      .subscribe(agencies => {
        this.suggestedAgencies = agencies;
      });

    this.marketForm.get('commercial').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.userService.searchUser(val)),
        map(users => users.map(user => User.fromData(user)))
      )
      .subscribe(users => {
        this.suggestedUsers = users;
      });

    this.marketForm.get('administrative').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.userService.searchUser(val)),
        map(users => users.map(user => User.fromData(user)))
      )
      .subscribe(users => {
        this.suggestedUsers = users;
      });
  }

  initialize() {
    console.log(this.data);
    switch (this.data.mode) {
      case MarketFormMode.CREATE:
        this.marketForm = this.fb.group({
          client: ['', Validators.required],
          facturationAnalysis: ['', Validators.required],
          keyContact: ['', Validators.required],
          commercial: ['', [Validators.required, entityValidator(User)]],
          administrative: ['', [Validators.required, entityValidator(User)]],
          name: ['', [Validators.required]],
          marketNumber: ['', [Validators.required]],
          agency: ['', [Validators.required, entityValidator(Agency)]],
          customerRequirement: ['', [Validators.required]],
        });
        if (this.data.defaultClient) {
          this.selectClient(this.data.defaultClient);
          this.marketForm.get('client').disable();
        }
        break;
      case MarketFormMode.EDIT:
        this.marketForm = this.fb.group({
          client: [this.data.defaultMarket.marketEstablishments.filter(a => a.role === MarketEstablishmentRole.CLIENT)[0], Validators.required],
          keyContact: [this.data.defaultMarket.marketPeoples[0], Validators.required],
          commercial: [this.data.defaultMarket.marketUsers.filter(u => u.role === MarketUserRole.COMMERCIAL)[0], [Validators.required, entityValidator(User)]],
          administrative: [this.data.defaultMarket.marketUsers.filter(u => u.role === MarketUserRole.ADMINISTRATIVE)[0], [Validators.required, entityValidator(User)]],
          name: [this.data.defaultMarket.name, [Validators.required]],
          facturationAnalysis: [this.data.defaultMarket.facturationAnalysis, [Validators.required]],
          marketNumber: [this.data.defaultMarket.marketNumber, [Validators.required]],
          agency: [this.data.defaultMarket.agency, [Validators.required, entityValidator(Agency)]],
          customerRequirement: [this.data.defaultMarket.customerRequirement, [Validators.required]],
        });
        break;
      default:
        this.marketForm = this.fb.group({
          client: '',
          keyContact: '',
          commercial: '',
          administrative: '',
          name: '',
          marketNumber: '',
          agency: '',
          customerRequirement: '',
          facturationAnalysis: '',
        });
        this.cancelAction.emit();
        break;
    }
  }

  handlefacturationValues(): string {
    let result = '';
    for (const elem of this.data.defaultMarket.marketEstablishments) {
      if (elem.role === "Principal") {
        result = elem.establishment.facturationAnalysis;
      }
    }
    return result;
  }

  clientSelected(evt: MatAutocompleteSelectedEvent) {
    this.selectClient(evt.option.value);
  }

  selectClient(establishment: FullEstablishment) {
    this.establishmentSelected = true;
    this.selectedEstablishment = establishment;
    this.selectedPeople = this.selectedEstablishment.establishment.contact;
    this.marketForm.get('client').setValue(this.selectedEstablishment.establishment.name);
    this.marketForm.get('keyContact').setValue(PeopleUtils.getName(this.selectedPeople));
    this.marketForm.get('commercial').setValue(User.fromData(this.selectedEstablishment.account.commercial));
    this.userService.get(this.authGuard.getUsername()).subscribe((res) => {
      this.marketForm.get('administrative').setValue(User.fromData(res));
    });
  }

  selectContact(evt: MatAutocompleteSelectedEvent) {
    this.selectedPeople = evt.option.value;
    this.marketForm.get('keyContact').setValue(PeopleUtils.getName(this.selectedPeople));
  }

  save() {
    this.saving = true;
    const market: IMarket = new Market();
    market.name = this.marketForm.get('name').value;
    market.marketNumber = this.marketForm.get('marketNumber').value;
    market.uuid = this.data.mode === MarketFormMode.EDIT ? this.data.defaultMarket.uuid : null;
    market.agency = this.marketForm.get('agency').value;
    market.facturationAnalysis = this.marketForm.get('facturationAnalysis').value;
    market.customerRequirement = this.marketForm.get('customerRequirement').value;
    const loopBreaker = JSON.parse(JSON.stringify(market));
    market.marketEstablishments.push(new MarketEstablishment(loopBreaker, this.selectedEstablishment.establishment, MarketEstablishmentRole.CLIENT));
    market.marketPeoples.push(new MarketPeople(loopBreaker, this.selectedPeople, MarketPeopleRole.KEY));
    market.marketUsers.push(new MarketUser(loopBreaker, this.marketForm.get('administrative').value, MarketUserRole.ADMINISTRATIVE));
    market.marketUsers.push(new MarketUser(loopBreaker, this.marketForm.get('commercial').value, MarketUserRole.COMMERCIAL));

    if (market.uuid) {
      this.marketService.update(market).subscribe((updated) => {
        this.marketSaved.emit(updated);
        setTimeout(() => this.saving = false);
      });
    } else {
      this.marketService.add(market).subscribe((newUuid) => {
        if (!newUuid || !newUuid.uuid) {
          console.log("An error occurred while adding new market");
          this.cancel();
        } else {
          market.uuid = newUuid.uuid;
          this.marketSaved.emit(market);
          setTimeout(() => this.saving = false);
        }
      });
    }
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  getPeopleName(people: People) {
    return PeopleUtils.getName(people);
  }
}

export interface MarketCreateData {
  mode: MarketFormMode | string;      // Display mode
  disabled?: boolean;                 // todo if needed
  inStep?: boolean;                   // Displayed in stepper
  defaultMarket?: IMarket;            // Default data
  defaultClient?: FullEstablishment;  // Default client
}

export enum MarketFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
