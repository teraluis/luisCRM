import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from "@angular/core";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {EstatesService, IdType, Premises} from "../../services/backend/estates.service";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {MatSelectChange} from "@angular/material/select";
import {People, PeopleWithRole} from "../../services/backend/people.service";
import {PeopleUtils} from "../utils/people-utils";
import {EstateUtils} from "../utils/estate-utils";
import {forkJoin} from "rxjs";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-estate-form-premises',
  templateUrl: './estate-form-premises.component.html',
  styleUrls: ['./estate-form-premises.component.scss']
})
export class EstateFormPremisesComponent implements OnInit, OnChanges {

  @Input() data: PremisesFormData;

  @Output() premisesSaved = new EventEmitter<Premises>();
  @Output() removePremises = new EventEmitter<Premises>();
  @Output() cancelAction = new EventEmitter<void>();

  currentData: Premises;
  contact: PeopleWithRole;
  premisesTypes: IdType[] = [];
  premisesTypeList: string[];
  premisesTypeId: string;
  heatingTypes: IdType[] = [];
  heatingTypeList: string[];
  heatingTypeId: string;
  unknowType: boolean;
  addContact = false;
  loading: boolean;
  saving = false;
  mode = {
    CREATE: PremisesFormMode.CREATE,
    EDIT: PremisesFormMode.EDIT
  };

  estateForm: FormGroup;

  constructor(private estatesService: EstatesService,
              public dialog: MatDialog,
              private fb: FormBuilder) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const disabled = changes.data.currentValue.disabled;
    if ( this.estateForm ) {
      if ( disabled ) {
        this.estateForm.get('premisesTypeId').disable();
        this.estateForm.get('number').disable();
        this.estateForm.get('area').disable();
        this.estateForm.get('premisesReference').disable();
        this.estateForm.get('heatingTypeId').disable();
        this.estateForm.get('floor').disable();
        this.estateForm.get('releaseDate').disable();
      } else {
        this.estateForm.get('premisesTypeId').enable();
        this.estateForm.get('number').enable();
        this.estateForm.get('area').enable();
        this.estateForm.get('premisesReference').enable();
        this.estateForm.get('heatingTypeId').enable();
        this.estateForm.get('floor').enable();
        this.estateForm.get('releaseDate').enable();
      }
    }
  }

  ngOnInit() {
    if (this.data.types && this.data.types.heating && this.data.types.premises) {
      this.premisesTypes = this.data.types.premises;
      this.heatingTypes = this.data.types.heating;
      this.initialize();
    } else {
      this.loading = true;
      forkJoin(
        this.estatesService.listPremisesTypes,
        this.estatesService.listHeatingTypes
      ).subscribe(([premisesTypes, heatingTypes]: [IdType[], IdType[]]) => {
        this.premisesTypes = premisesTypes;
        this.heatingTypes = heatingTypes;
        this.initialize();
        this.loading = false;
      });
    }
  }

  initialize() {
    switch (this.data.mode) {
      case PremisesFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? EstateUtils.duplicatePremises(this.data.defaultData)
          : EstateUtils.buildPremises();
        break;
      case PremisesFormMode.EDIT:
        this.currentData = EstateUtils.buildPremises(this.data.defaultData);
        break;
      default:
        this.currentData = EstateUtils.buildPremises();
        this.cancelAction.emit();
        break;
    }
    this.contact = this.currentData.contact ? PeopleUtils.buildPeopleWithRole(this.currentData.contact) : undefined;
    this.premisesTypeList = this.premisesTypes.map(p => p.id);
    this.heatingTypeList = this.heatingTypes.map(h => h.id);
    this.premisesTypeId = this.currentData.premisesType ? this.currentData.premisesType.id : undefined;
    this.heatingTypeId = this.currentData.heatingType ? this.currentData.heatingType.id : undefined;

    this.estateForm = this.fb.group({
      premisesTypeId: [{value: this.premisesTypeId, disabled: this.data.disabled}, Validators.required],
      number: [{value: this.currentData.number === 'N/A' ? '' : this.currentData.number, disabled: this.data.disabled}, Validators.required],
      area: [{value: this.currentData.area, disabled: this.data.disabled}, [Validators.min(0)]],
      premisesReference: [{value: this.currentData.premisesReference, disabled: this.data.disabled}],
      heatingTypeId: [{value: this.heatingTypeId, disabled: this.data.disabled}],
      floor: [{value: this.currentData.floor, disabled: this.data.disabled}],
      releaseDate: [{value: this.currentData.releaseDate, disabled: this.data.disabled}]
    });
  }

  isComplete() {
    switch (this.data.mode) {
      case PremisesFormMode.CREATE:
        return this.isPremisesComplete();
      case PremisesFormMode.EDIT:
        return this.isPremisesComplete() && this.isPremisesChanged();
      default:
        return false;
    }
  }

  save() {
    this.currentData.premisesType = this.premisesTypes.find((value) => value.id ===  this.estateForm.get('premisesTypeId').value);
    this.currentData.heatingType = this.heatingTypes.find((value) => value.id === this.estateForm.get('heatingTypeId').value);
    this.currentData.number = this.estateForm.get('number').value;
    this.currentData.area = this.estateForm.get('area').value;
    this.currentData.premisesReference = this.estateForm.get('premisesReference').value;
    this.currentData.floor = this.estateForm.get('floor').value;
    this.currentData.releaseDate = this.estateForm.get('releaseDate').value;

    switch (this.data.mode) {
      case PremisesFormMode.CREATE:
        if (!this.currentData.id) {
          this.addPremises();
        } else {
          this.updatePremises();
        }
        break;
      case PremisesFormMode.EDIT:
        this.updatePremises();
        break;
      default:
        break;
    }
  }

  changeHeatingType(ev: MatSelectChange) {
    this.unknowType = ev.value === 'unknow';
  }

  isPremisesChanged() {
    return this.currentData.number !== this.data.defaultData.number || this.currentData.floor !== this.data.defaultData.floor
      || this.currentData.area !== this.data.defaultData.area || this.currentData.releaseDate !== this.data.defaultData.releaseDate
      || this.currentData.premisesType.id !== this.data.defaultData.premisesType.id || this.currentData.customPremisesType !== this.data.defaultData.customPremisesType
      || this.currentData.contact !== this.data.defaultData.contact || this.currentData.customHeatingType !== this.data.defaultData.customHeatingType
      || (this.currentData.heatingType && !this.data.defaultData.heatingType || (this.currentData.heatingType && this.data.defaultData.heatingType && this.currentData.premisesType.id !== this.data.defaultData.premisesType.id))
      || this.currentData.premisesReference !== this.data.defaultData.premisesReference;
  }

  isPremisesComplete() {
    return (this.currentData.number !== undefined && this.currentData.number !== null && this.currentData.number !== '')
      && this.currentData.premisesType;
  }

  updatePremises() {
    this.saving = true;
    this.estatesService.updatePremises(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while updating premises " + this.currentData.id);
      } else {
        this.currentData = EstateUtils.buildPremises(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  addPremises() {
    this.saving = true;
    this.estatesService.addPremises(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while adding new premises");
      } else {
        this.currentData = EstateUtils.buildPremises(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = EstateUtils.buildPremises(this.currentData);
    this.premisesSaved.emit(EstateUtils.buildPremises(this.currentData));
  }

  delete(premises: Premises) {
    const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    deleteDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removePremises.emit(premises);
      }
    });
  }

  updateContact(contact: PeopleWithRole) {
    this.addContact = false;
    this.contact = contact;
    this.currentData.contact = PeopleUtils.buildPeople(contact.people);
    this.updatePremises();
  }

  removeContact(contact: PeopleWithRole) {
    this.addContact = false;
    this.contact = undefined;
    this.currentData.contact = undefined;
    this.updatePremises();
  }

  reset() {
    if (this.data.defaultData && ((!this.data.defaultData.contact && this.contact)
      || (this.data.defaultData.contact && this.contact && this.data.defaultData.contact.uuid !== this.contact.people.uuid))) {
      this.contact = null;
    }
    this.cancelAction.emit();
    this.initialize();
  }

  cancel() {
    this.addContact = false;
    this.initialize();
    this.cancelAction.emit();
  }

  getPremisesTypeName(id: string) {
    const type = this.premisesTypes.filter((com) => com.id === id)[0];
    return type ? type.type : '';
  }

  getHeatingTypeName(id: string) {
    if (id === 'unknow') {
      return 'Inconnu';
    } else {
      const type = this.heatingTypes.filter((com) => com.id === id)[0];
      return type ? type.type : '';
    }
  }

  getContactName(contact: People) {
    return PeopleUtils.getName(contact);
  }
}

export interface PremisesFormData {
  mode: PremisesFormMode | string;  // Display mode
  disabled?: boolean;               // Disabled fields
  deletable?: boolean;              // Show delete button
  inStep?: boolean;                 // If displayed in another stepper
  defaultData?: Premises;           // Default data
  types?: { heating: IdType[], premises: IdType[] };  // Give to avoid loading
}

export enum PremisesFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
