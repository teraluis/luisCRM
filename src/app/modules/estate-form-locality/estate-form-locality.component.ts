import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {EstatesService, IdType, Locality} from "../../services/backend/estates.service";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {MatSelectChange} from "@angular/material/select";
import {EstateUtils} from "../utils/estate-utils";
import {Address, AddressType, AddressWithRole} from "../../services/backend/addresses.service";
import {AddressUtils} from "../utils/address-utils";
import {InfoService} from "../../services/front/info.service";
import {MatStepper} from "@angular/material/stepper";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-estate-form-locality',
  templateUrl: './estate-form-locality.component.html',
  styleUrls: ['./estate-form-locality.component.scss']
})
export class EstateFormLocalityComponent implements OnInit, OnChanges {

  @ViewChild('stepper') stepper: MatStepper;

  @Input() data: LocalityFormData;

  @Output() localitySaved = new EventEmitter<Locality>();
  @Output() removeLocality = new EventEmitter<Locality>();
  @Output() cancelAction = new EventEmitter<void>();

  currentData: Locality;
  heatingTypes: IdType[] = [];
  heatingTypeList: string[];
  heatingTypeId: string;
  unknowType: boolean;
  loading: boolean;
  saving = false;
  showAddAddress = false;
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.COORDINATES];
  mode = {
    CREATE: LocalityFormMode.CREATE,
    EDIT: LocalityFormMode.EDIT
  };

  estateForm: FormGroup;

  constructor(private estatesService: EstatesService,
              private infoService: InfoService,
              public dialog: MatDialog,
              private fb: FormBuilder) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const disabled = changes.data.currentValue.disabled;
    if ( this.estateForm ) {
      if ( disabled ) {
        this.estateForm.get('name').disable();
        this.estateForm.get('cadastralReference').disable();
        this.estateForm.get('constructionDate').disable();
        this.estateForm.get('inseeCoordinates').disable();
        this.estateForm.get('floorQ').disable();
        this.estateForm.get('condominium').disable();
        this.estateForm.get('buildingPermitDate').disable();
        this.estateForm.get('heatingTypeId').disable();
      } else {
        this.estateForm.get('name').enable();
        this.estateForm.get('cadastralReference').enable();
        this.estateForm.get('constructionDate').enable();
        this.estateForm.get('inseeCoordinates').enable();
        this.estateForm.get('floorQ').enable();
        this.estateForm.get('condominium').enable();
        this.estateForm.get('buildingPermitDate').enable();
        this.estateForm.get('heatingTypeId').enable();
      }
    }
  }

  ngOnInit() {
    if (this.data.heatingTypes) {
      this.heatingTypes = this.data.heatingTypes;
      this.initialize();
    } else {
      this.loading = true;
      this.estatesService.listHeatingTypes().subscribe((types) => {
        this.heatingTypes = types;
        this.initialize();
        this.loading = false;
      });
    }
  }

  initialize() {
    switch (this.data.mode) {
      case LocalityFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? EstateUtils.duplicateLocality(this.data.defaultData)
          : EstateUtils.buildLocality();
        break;
      case LocalityFormMode.EDIT:
        this.currentData = EstateUtils.buildLocality(this.data.defaultData);
        break;
      default:
        this.currentData = EstateUtils.buildLocality();
        this.cancelAction.emit();
        break;
    }
    this.heatingTypeList = this.heatingTypes.map(h => h.id);

    this.estateForm = this.fb.group({
      name: [{value: this.currentData.name, disabled: this.data.disabled}, Validators.required],
      cadastralReference: [{value: this.currentData.cadastralReference, disabled: this.data.disabled}],
      constructionDate: [{value: this.currentData.constructionDate, disabled: this.data.disabled || this.data.mode === this.mode.CREATE}],
      inseeCoordinates: [{value: this.currentData.inseeCoordinates, disabled: this.data.disabled}],
      floorQ: [{value: this.currentData.floorQ, disabled: this.data.disabled}, [Validators.min(0)]],
      condominium: [{value: this.currentData.condominium, disabled: this.data.disabled}],
      buildingPermitDate: [{value: this.currentData.buildingPermitDate, disabled: this.data.disabled || this.data.mode === this.mode.CREATE}],
      heatingTypeId: [{value: this.heatingTypeId, disabled: this.data.disabled}]
    });
  }

  isComplete() {
    switch (this.data.mode) {
      case LocalityFormMode.CREATE:
        return this.isLocalityComplete();
      case LocalityFormMode.EDIT:
        return this.isLocalityComplete() && this.isLocalityChanged();
      default:
        return false;
    }
  }

  save() {
    this.currentData.heatingType = this.heatingTypes.find((value) => value.id === this.estateForm.get('heatingTypeId').value);
    this.currentData.name = this.estateForm.get('name').value;
    this.currentData.cadastralReference = this.estateForm.get('cadastralReference').value;
    this.currentData.constructionDate = this.estateForm.get('constructionDate').value;
    this.currentData.inseeCoordinates = this.estateForm.get('inseeCoordinates').value;
    this.currentData.floorQ = this.estateForm.get('floorQ').value;
    this.currentData.condominium = this.estateForm.get('condominium').value;
    this.currentData.buildingPermitDate = this.estateForm.get('buildingPermitDate').value;

    switch (this.data.mode) {
      case LocalityFormMode.CREATE:
        if (!this.currentData.id) {
          this.addLocality();
        } else {
          this.updateLocality();
        }
        break;
      case LocalityFormMode.EDIT:
        this.updateLocality();
        break;
      default:
        break;
    }
  }

  isLocalityChanged() {
    return this.currentData.name !== this.data.defaultData.name || this.currentData.floorQ !== this.data.defaultData.floorQ
      || this.currentData.cadastralReference !== this.data.defaultData.cadastralReference || this.currentData.buildingPermitDate !== this.data.defaultData.buildingPermitDate
      || this.currentData.constructionDate !== this.data.defaultData.constructionDate || this.currentData.condominium !== this.data.defaultData.condominium
      || this.currentData.inseeCoordinates !== this.data.defaultData.inseeCoordinates || this.currentData.customHeatingType !== this.data.defaultData.customHeatingType
      || (this.currentData.heatingType && !this.data.defaultData.heatingType || (this.currentData.heatingType && this.data.defaultData.heatingType && this.currentData.heatingType.id !== this.data.defaultData.heatingType.id));
  }

  isLocalityComplete() {
    return !!this.currentData.name;
  }

  updateLocality() {
    this.saving = true;
    this.estatesService.updateLocality(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while updating locality " + this.currentData.id);
      } else {
        this.currentData = EstateUtils.buildLocality(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  addLocality() {
    this.saving = true;
    this.estatesService.addLocality(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while adding new locality");
      } else {
        this.currentData = EstateUtils.buildLocality(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = EstateUtils.buildLocality(this.currentData);
    this.localitySaved.emit(EstateUtils.buildLocality(this.currentData));
  }

  delete(locality: Locality) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeLocality.emit(locality);
      }
    });
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  changeHeatingType(ev: MatSelectChange) {
    this.unknowType = ev.value === 'unknow';
  }

  getHeatingTypeName(id: string) {
    if (id === 'unknow') {
      return 'Inconnu';
    } else {
      const type = this.heatingTypes.filter((com) => com.id === id)[0];
      return type ? type.type : '';
    }
  }

  getAddressName(address: Address) {
    return AddressUtils.getFullName(address);
  }

  updateAddress(address: AddressWithRole) {
    this.infoService.displaySaveSuccess();
  }

  removeAddress(address: Address) {
    this.currentData.addresses = this.currentData.addresses.filter(a => a.uuid !== address.uuid);
  }

  addAddress(address: AddressWithRole) {
    this.currentData.addresses.push(address.address);
    if (this.data.mode === LocalityFormMode.CREATE) {
      this.stepper.next();
    } else {
      this.updateLocality();
    }
  }
}

export interface LocalityFormData {
  mode: LocalityFormMode | string;  // Display mode
  disabled?: boolean;               // Disable fields
  deletable?: boolean;              // Show delete button
  inStep?: boolean;                 // Displayed in stepper
  defaultData?: Locality;           // Default data
  defaultAddress?: Address;         // Default address at creation
  heatingTypes?: IdType[];          // Give to avoid loading
}

export enum LocalityFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
