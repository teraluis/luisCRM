import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Establishment, EstablishmentsService, EstablishmentWithRole, FacturationAnalysis} from '../../services/backend/establishments.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Entity} from '../../services/backend/entities.service';
import {ActivityService, IActivity} from '../../services/backend/activity.service';
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {InfoService} from '../../services/front/info.service';
import {MatSelectChange} from '@angular/material/select';
import {EstablishmentUtils} from '../utils/establishment-utils';
import {AccountUtils} from '../utils/account-utils';
import {AccountType, AccountWithRole} from '../../services/backend/accounts.service';
import {MatStepper} from '@angular/material/stepper';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Address} from "../../services/backend/addresses.service";
import {AddressUtils} from "../utils/address-utils";
import {debounceTime} from "rxjs/operators";
import {AgencyService, IAgency} from "../../services/backend/agency.service";
import {forkJoin} from "rxjs";
import {validateIban} from "../../core/validators";

@Component({
  selector: 'app-establishment-form',
  templateUrl: './establishment-form.component.html',
  styleUrls: ['./establishment-form.component.scss']
})
export class EstablishmentFormComponent implements OnInit {

  @ViewChild('stepper') stepper: MatStepper;

  @Input() data: EstablishmentFormData;

  @Output() establishmentSaved = new EventEmitter<EstablishmentWithRole>();
  @Output() removeEstablishment = new EventEmitter<EstablishmentWithRole>();
  @Output() cancelAction = new EventEmitter<void>();

  establishmentForm: FormGroup;

  currentData: EstablishmentWithRole;
  entity: Entity;
  activities: IActivity[];
  activityList: string[];
  agencies: IAgency[];
  agencyList: string[];
  facturationAnalysis: string[] = Object.values(FacturationAnalysis);
  search: FormControl;
  searchField: string;
  suggestedEstablishment: Establishment[];
  proType = AccountType.PROFESSIONAL;
  isSiretUnique = false;
  lastNicNumber: string;
  nicNumber: string;
  defaultNicNumber: string;
  establishmentLoading = false;
  loading: boolean;
  saving = false;
  mode = {
    CREATE: EstablishmentFormMode.CREATE,
    EDIT: EstablishmentFormMode.EDIT,
    SEARCH: EstablishmentFormMode.SEARCH
  };

  constructor(private establishmentsService: EstablishmentsService,
              private fb: FormBuilder,
              private activityService: ActivityService,
              private infoService: InfoService,
              public agencyService: AgencyService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.search = new FormControl({value: this.searchField, disabled: this.data.disabled});
    this.search.valueChanges.pipe(debounceTime(300))
      .subscribe((res) => this.suggest(res));
    if (this.data.defaultList) {
      this.activities = this.data.defaultList.activities;
      this.agencies = this.data.defaultList.agencies;
      this.initialize();
    } else {
      this.loading = true;
      forkJoin(
        this.activityService.getAll(),
        this.agencyService.getAll()
      ).subscribe(([activities, agencies]) => {
        this.activities = activities;
        this.agencies = agencies;
        this.initialize();
        this.loading = false;
      });
    }
  }

  initialize() {
    this.entity = AccountUtils.buildEntity(this.data.defaultEntity);
    switch (this.data.mode) {
      case EstablishmentFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? EstablishmentUtils.buildEstablishmentWithRole(EstablishmentUtils.duplicate(this.data.defaultData.establishment), this.data.defaultData.role)
          : EstablishmentUtils.buildEstablishmentWithRole();
        break;
      case EstablishmentFormMode.EDIT:
        this.currentData = EstablishmentUtils.buildEstablishmentWithRole(this.data.defaultData.establishment, this.data.defaultData.role);
        this.isSiretUnique = true;
        break;
      case EstablishmentFormMode.SEARCH:
        this.currentData = this.data.defaultData
          ? EstablishmentUtils.buildEstablishmentWithRole(this.data.defaultData.establishment, this.data.defaultData.role)
          : EstablishmentUtils.buildEstablishmentWithRole();
        break;
    }
    this.activityList = this.activities.map(a => a.uuid);
    this.entity = AccountUtils.buildEntity(this.data.defaultEntity);
    this.activityList = this.activities.map(a => a.uuid);
    this.agencyList = this.agencies.map(a => a.uuid);

    this.establishmentForm = this.fb.group({
      role: [{value: this.currentData.role, disabled: this.data.disabledRole}, this.data.roles ? Validators.required : []],
      activity: [{value: this.currentData.establishment.activity ? this.currentData.establishment.activity.uuid : undefined, disabled: this.data.disabled}, Validators.required],
      agency: [{value: this.currentData.establishment.agency ? this.currentData.establishment.agency.uuid : undefined, disabled: this.data.disabled}, Validators.required],
      facturationAnalysis: [{value: this.currentData.establishment.facturationAnalysis ? this.currentData.establishment.facturationAnalysis : undefined, disabled: this.data.disabled}, Validators.required],
      establishmentName: [{value: this.currentData.establishment.name, disabled: this.data.disabled}, Validators.required],
      establishmentMail: [{value: this.currentData.establishment.mail, disabled: this.data.disabled}],
      establishmentPhone: [{value: this.currentData.establishment.phone, disabled: this.data.disabled}],
      establishmentCorporateName: [{value: this.currentData.establishment.corporateName, disabled: this.data.disabled}, [Validators.required]],
      siren: [{value: this.entity.siren, disabled: true}, [Validators.required]],
      nicNumber: [{value: this.currentData.establishment.siret ? this.currentData.establishment.siret.substring(9) : undefined, disabled: this.data.disabled}, [Validators.required, Validators.minLength(5), Validators.maxLength(5)]],
      establishmentIban: [{value: this.currentData.establishment.iban, disabled: false}, [Validators.required, validateIban()]],
      establishmentBic: [{value: this.currentData.establishment.bic, disabled: false}, [Validators.required, Validators.minLength(8), Validators.maxLength(11)]],
      establishmentDescription: [{value: this.currentData.establishment.description, disabled: this.data.disabled}],
    });

    this.lastNicNumber = this.nicNumber;
    this.defaultNicNumber = this.nicNumber;
  }

  isComplete() {
    switch (this.data.mode) {
      case EstablishmentFormMode.CREATE:
        return this.isEstablishmentComplete();
      case EstablishmentFormMode.EDIT:
        return this.isEstablishmentComplete() && this.isEstablishmentChanged();
      case EstablishmentFormMode.SEARCH:
        return this.isSelectionComplete();
      default:
        return false;
    }
  }

  save() {
    const rawValues = this.establishmentForm.getRawValue();
    this.currentData.establishment.siret = this.entity.siren + rawValues.nicNumber;
    this.currentData.establishment.iban = rawValues.establishmentIban;
    this.currentData.establishment.bic = rawValues.establishmentBic;
    this.currentData.establishment.name = rawValues.establishmentName;
    this.currentData.establishment.corporateName = rawValues.establishmentCorporateName;
    this.currentData.establishment.mail = rawValues.establishmentMail;
    this.currentData.establishment.phone = rawValues.establishmentPhone;
    this.currentData.establishment.description = rawValues.establishmentDescription;
    this.currentData.establishment.facturationAnalysis = rawValues.facturationAnalysis;

    switch (this.data.mode) {
      case EstablishmentFormMode.CREATE:
        if (!this.currentData.establishment.uuid) {
          this.addEstablishment();
        } else {
          this.updateEstablishment();
        }
        break;
      case EstablishmentFormMode.EDIT:
        this.updateEstablishment();
        break;
      case EstablishmentFormMode.SEARCH:
        this.validate();
        break;
      default:
        break;
    }
  }

  checkSiretValidity() {
    if (!this.establishmentLoading && this.establishmentForm.get('nicNumber').value && this.establishmentForm.get('nicNumber').value.length === 5) {
      if (this.establishmentForm.get('nicNumber').value !== this.lastNicNumber && this.establishmentForm.get('nicNumber').value !== this.defaultNicNumber) {
        this.updateSiretValidity();
      }
      return this.isSiretUnique ? !this.isComplete() : true;
    } else {
      return true;
    }
  }

  updateSiretValidity() {
    this.establishmentLoading = true;
    this.lastNicNumber = this.establishmentForm.get('nicNumber').value;
    this.establishmentsService.getFromSiret(this.entity.siren + this.establishmentForm.get('nicNumber').value).subscribe((resp) => {
      this.establishmentLoading = false;
      if (resp && resp.uuid) {
        this.isSiretUnique = false;
        this.infoService.displayError('Le numéro SIRET est déjà connu.');
      } else {
        this.isSiretUnique = true;
      }
    });
  }

  isEstablishmentComplete() {
    return this.isSiretUnique && this.currentData.establishment.name && this.currentData.establishment.corporateName
      && this.nicNumber && this.nicNumber.length === 5 && this.currentData.establishment.activity
      && this.currentData.establishment.facturationAnalysis && this.currentData.establishment.agency
      && this.currentData.establishment.iban && this.currentData.establishment.bic;
  }

  isEstablishmentChanged() {
    return this.currentData.establishment.name !== this.data.defaultData.establishment.name || this.currentData.establishment.corporateName !== this.data.defaultData.establishment.corporateName
      || this.currentData.establishment.description !== this.data.defaultData.establishment.description || this.currentData.establishment.mail !== this.data.defaultData.establishment.mail
      || this.currentData.establishment.phone !== this.data.defaultData.establishment.phone || this.nicNumber !== this.defaultNicNumber
      || this.currentData.establishment.activity.uuid !== this.data.defaultData.establishment.activity.uuid
      || this.currentData.establishment.facturationAnalysis !== this.data.defaultData.establishment.facturationAnalysis
      || this.currentData.establishment.agency.uuid !== this.data.defaultData.establishment.agency.uuid
      || this.currentData.establishment.iban !== this.data.defaultData.establishment.iban
      || this.currentData.establishment.bic !== this.data.defaultData.establishment.bic;
  }

  isSelectionComplete() {
    return (!this.data.roles || this.currentData.role) && this.currentData.establishment && this.currentData.establishment.uuid;
  }

  suggest(text: string) {
    if (text && text.length > 1) {
      this.establishmentsService.search(text).subscribe((results) => {
        this.suggestedEstablishment = results;
      });
    } else {
      this.suggestedEstablishment = [];
    }
  }

  addEstablishment() {
    this.saving = true;
    this.currentData.establishment.entity = this.entity.uuid;
    this.establishmentsService.add(this.currentData.establishment).subscribe((newUuid) => {
      if (!newUuid || !newUuid.uuid) {
        console.log('An error occurred while adding a new establishment');
      } else {
        this.currentData.establishment.uuid = newUuid.uuid;
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  updateEstablishment() {
    this.saving = true;
    this.establishmentsService.update(this.currentData.establishment).subscribe((updatedEstablishment) => {
      if (!updatedEstablishment) {
        console.log('An error occurred while updating establishment ' + this.currentData.establishment.uuid);
      } else {
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = EstablishmentUtils.buildEstablishmentWithRole(this.currentData.establishment, this.currentData.role);
    this.establishmentSaved.emit(EstablishmentUtils.buildEstablishmentWithRole(this.currentData.establishment, this.currentData.role));
  }

  delete(establishment: EstablishmentWithRole) {
    const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    deleteDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeEstablishment.emit(establishment);
      }
    });
  }

  changeActivity(ev: MatSelectChange) {
    this.currentData.establishment.activity = this.activities.find((value) => value.uuid === ev.value);
  }

  setAgency(ev: MatSelectChange) {
    this.currentData.establishment.agency = this.agencies.find((value) => value.uuid === ev.value);
    if ( !this.establishmentForm.get('establishmentIban').value  ) {
      this.currentData.establishment.iban = this.currentData.establishment.agency.referenceIban;
      this.currentData.establishment.bic = this.currentData.establishment.agency.referenceBic;
      this.establishmentForm.get('establishmentIban').setValue(this.currentData.establishment.iban);
      this.establishmentForm.get('establishmentBic').setValue(this.currentData.establishment.bic);
    }
  }

  getActivityName(id: string) {
    const activity: IActivity = this.activities.filter((com) => com.uuid === id)[0];
    return activity ? activity.name : '';
  }

  getAgencyName(id: string) {
    const agency: IAgency = this.agencies.filter((a) => a.uuid === id)[0];
    return agency ? agency.name : '';
  }

  getAddressName(address: Address) {
    return AddressUtils.getLocality(address);
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  selectAccount(awr: AccountWithRole) {
    this.entity = AccountUtils.buildEntity(awr.account.entity);
    this.establishmentForm.get('siren').setValue(this.entity.siren);
    this.stepper.next();
  }

  back() {
    if (this.stepper.selectedIndex === 0) {
      this.cancel();
    } else {
      this.stepper.previous();
    }
  }
}

export interface EstablishmentFormData {
  mode: EstablishmentFormMode | string; // Display mode
  disabled?: boolean;                   // Disable fields
  disabledRole?: boolean;               // Disable role field
  deletable?: boolean;                  // Show delete button
  inStep?: boolean;                     // If displayed in another stepper
  roles?: string[];                     // List of available roles
  defaultEntity?: Entity;               // Default entity
  defaultData?: EstablishmentWithRole;  // Default data
  defaultList?: {                       // Give to avoid loading
    activities: IActivity[],
    agencies: IAgency[]
  };
}

export enum EstablishmentFormMode {
  CREATE = 'create',
  EDIT = 'edit',
  SEARCH = 'search'
}
