import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from "@angular/core";
import {MatSelect, MatSelectChange} from "@angular/material/select";
import {EstatesService, Estate, AllEstateTypes, Premises, Annex} from "../../services/backend/estates.service";
import {Address, AddressType, AddressWithRole} from "../../services/backend/addresses.service";
import {MatStepper} from "@angular/material/stepper";
import {AddressUtils} from "../utils/address-utils";
import {AccountUtils} from "../utils/account-utils";
import {EstateOwnerType, EstateUtils} from "../utils/estate-utils";
import {Account, AccountsService, AccountType, AccountWithRole} from "../../services/backend/accounts.service";
import {EstablishmentUtils} from "../utils/establishment-utils";
import {Establishment, EstablishmentWithRole} from "../../services/backend/establishments.service";
import {PeopleUtils} from "../utils/people-utils";

@Component({
  selector: 'app-estate-create',
  templateUrl: './estate-create.component.html',
  styleUrls: ['./estate-create.component.scss']
})
export class EstateCreateComponent implements OnInit {

  @ViewChild('other') otherField: ElementRef;
  @ViewChild('matSelect') selectField: MatSelect;
  @ViewChild('stepper') stepper: MatStepper;

  @Input() data: EstateCreateData;

  @Output() estateSaved = new EventEmitter<Estate>();
  @Output() removeEstate = new EventEmitter<Estate>();
  @Output() cancel = new EventEmitter<any>();

  readonly TYPE_OTHER = 'estate_type-4ec79da9-ef28-4a30-b230-beb1d701ab85';

  estate: Estate;
  address: Address;
  premises: Premises;
  annex: Annex;
  ownerName: string;
  allTypes: AllEstateTypes;
  estateTypeIds: string[];
  selectedType: string;
  customEstateType = false;
  loading: boolean;
  saving = false;
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.COORDINATES];
  defaultCreation: CreatableElement = CreatableElement.PREMISES;
  creatableElement = {
    PREMISES: CreatableElement.PREMISES,
    ANNEX: CreatableElement.ANNEX
  };
  selectedClientType = EstateOwnerType.ESTABLISHMENT;
  clientTypes = {
    ESTABLISHMENT: EstateOwnerType.ESTABLISHMENT,
    INDIVIDUAL: EstateOwnerType.INDIVIDUAL,
    ACCOUNT: EstateOwnerType.ACCOUNT
  };
  accountTypes = {
    PROFESSIONAL: AccountType.PROFESSIONAL,
    INDIVIDUAL: AccountType.INDIVIDUAL
  };

  constructor(private estatesService: EstatesService,
              private accountsService: AccountsService) {
  }

  ngOnInit() {
    if (this.data.allTypes) {
      this.allTypes = this.data.allTypes;
      this.initialize();
    } else {
      this.loading = true;
      this.estatesService.listAllTypes().subscribe((types) => {
        this.allTypes = types;
        this.initialize();
        this.loading = false;
      });
    }
  }

  initialize() {
    this.estateTypeIds = this.allTypes.estate.map(e => e.id);
    this.estate = EstateUtils.buildEstate();
    this.estate.establishment = this.data.defaultEstablishment;
    this.estate.account = this.data.defaultAccount;
    this.ownerName = EstateUtils.getOwnerName(this.estate);
    this.address = this.data.defaultAddress ? AddressUtils.buildAddress(this.data.defaultAddress) : undefined;
  }

  isComplete() {
    return this.estate.estateType && this.estate.adxReference
      && (this.estate.estateType.id !== this.TYPE_OTHER || this.estate.customEstateType);
  }

  back() {
    if (this.stepper.selectedIndex === 0) {
      this.cancel.emit();
    } else {
      this.stepper.previous();
    }
  }

  selectPremises(premises: Premises) {
    this.premises = premises;
    this.annex = null;
    this.stepper.next();
  }

  selectAnnex(annex: Annex) {
    this.annex = annex;
    this.premises = null;
    this.stepper.next();
  }

  changeSelectionState(ev: MatSelectChange) {
    const estateTypeId = ev.value;
    if (estateTypeId === this.TYPE_OTHER) {
      this.customEstateType = true;
      setTimeout(() => this.otherField.nativeElement.focus());
    } else {
      this.customEstateType = false;
    }
    this.estate.estateType = this.allTypes.estate.find((value) => value.id === estateTypeId);
  }

  clearOtherInput() {
    this.customEstateType = false;
    this.estate.estateType = this.allTypes.estate[0];
    this.estate.customEstateType = null;
    setTimeout(() => this.selectField.open());
  }

  save(address: AddressWithRole) {
    this.address = AddressUtils.buildAddress(address.address);
    this.estate.localities = [EstateUtils.buildLocality()];
    this.estate.localities[0].addresses = [this.address];
    this.estate.localities[0].premises = this.premises ? [this.premises] : [];
    this.estate.localities[0].annexes = this.annex ? [this.annex] : [];
    this.estate.localities[0].creationDate = new Date().getTime();
    this.saveEstate();
  }

  saveEstate() {
    this.saving = true;
    this.estatesService.add(this.estate).subscribe((newEstate) => {
      if (!newEstate || !newEstate.id) {
        console.log("An error occurred while adding new estate");
      } else {
        this.estate = EstateUtils.buildEstate(newEstate);
        this.estateSaved.emit(EstateUtils.buildEstate(newEstate));
      }
      setTimeout(() => this.saving = false);
    });
  }

  selectEstablishment(ewr: EstablishmentWithRole) {
    this.saving = true;
    this.accountsService.getFromEntity(ewr.establishment.entity).subscribe((account) => {
      if (account) {
        this.estate.establishment = EstablishmentUtils.buildEstablishment(ewr.establishment);
        this.selectAccount(AccountUtils.buildAccountWithRole(account));
      }
      this.saving = false;
    });
  }

  selectAccount(account: AccountWithRole) {
    this.estate.account = AccountUtils.buildAccount(account.account);
    this.ownerName = EstateUtils.getOwnerName(this.estate);
    this.stepper.next();
  }

  getTypeName(id: string) {
    return this.allTypes.estate.filter(type => type.id === id)[0].type;
  }
}

/* This component is a create mode only */
export interface EstateCreateData {
  inStep?: boolean;                     // If displayed in another stepper
  defaultAddress?: Address;             // Default address
  defaultEstablishment?: Establishment; // Default owner (establishment)
  defaultAccount?: Account;             // Default owner (account)
  allTypes?: AllEstateTypes;            // Give to avoid loading
}

enum CreatableElement {
  PREMISES = 'Local / Appartement',
  ANNEX = 'Annexe'
}
