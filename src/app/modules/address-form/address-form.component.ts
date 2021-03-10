import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Location, LocationService} from "../../services/backend/location.service";
import {AddressesService, AddressType, AddressWithRole} from "../../services/backend/addresses.service";
import {debounceTime} from "rxjs/operators";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {AddressUtils} from "../utils/address-utils";
import {of} from "rxjs";

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss']
})
export class AddressFormComponent implements OnInit {

  @Input() data: AddressFormData;

  @Output() addressSaved = new EventEmitter<AddressWithRole>();
  @Output() removeAddress = new EventEmitter<AddressWithRole>();
  @Output() cancelAction = new EventEmitter<void>();

  addressForm: FormGroup;

  currentData: AddressWithRole;
  search: FormControl;
  suggestedLocation: Location[];
  addressTypes: AddressType[];
  saving = false;
  mode = {
    CREATE: AddressFormMode.CREATE,
    EDIT: AddressFormMode.EDIT
  };

  constructor(private addressesService: AddressesService,
              private locationService: LocationService,
              private fb: FormBuilder,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.addressTypes = this.data.types ? this.data.types : Object.values(AddressType);
    this.initialize();
  }

  initialize() {
    switch (this.data.mode) {
      case AddressFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? AddressUtils.buildAddressWithRole(AddressUtils.duplicate(this.data.defaultData.address), this.data.defaultData.role)
          : AddressUtils.buildAddressWithRole();
        break;
      case AddressFormMode.EDIT:
        this.currentData = AddressUtils.buildAddressWithRole(this.data.defaultData.address, this.data.defaultData.role);
        break;
      default:
        this.currentData = AddressUtils.buildAddressWithRole();
        this.cancelAction.emit();
        break;
    }
    this.addressForm = this.fb.group({
      role: [{value: this.currentData.role, disabled: this.data.disabledRole}, this.data.roles ? Validators.required : []],
      postCode: [{value: this.currentData.address.postCode, disabled: this.data.disabled}, Validators.required],
      city: [{value: this.currentData.address.city, disabled: this.data.disabled}, Validators.required],
      staircase: [{value: this.currentData.address.staircase, disabled: this.data.disabled}],
      inseeCoordinates: [{value: this.currentData.address.inseeCoordinates, disabled: this.data.disabled}],
      address2: [{value: this.currentData.address.address2, disabled: this.data.disabled}],
      address1: [{value: this.currentData.address.address1, disabled: this.data.disabled}, Validators.required]
    });
  }

  suggestAddress() {
    of(this.addressForm.getRawValue().address1).pipe(debounceTime(300)).subscribe((search) => {
      if (search) {
        this.searchLocation(search);
      }
    });
  }


  isComplete() {
    switch (this.data.mode) {
      case AddressFormMode.CREATE:
        return this.isAddressComplete();
      case AddressFormMode.EDIT:
        return this.isAddressComplete() && this.isAddressChanged();
      default:
        return false;
    }
  }

  save() {
    const rawValue = this.addressForm.getRawValue();
    this.currentData.address.address1 = rawValue.address1;
    this.currentData.address.address2 = rawValue.address2;
    this.currentData.address.postCode = rawValue.postCode;
    this.currentData.address.type = AddressType.PHYSICAL;
    this.currentData.address.inseeCoordinates = rawValue.inseeCoordinates;
    this.currentData.address.city = rawValue.city;
    this.currentData.address.staircase = rawValue.staircase;
    switch (this.data.mode) {
      case AddressFormMode.CREATE:
        if (!this.currentData.address.uuid) {
          this.addAddress();
        } else {
          this.updateAddress();
        }
        break;
      case AddressFormMode.EDIT:
        this.updateAddress();
        break;
      default:
        break;
    }
  }

  isAddressComplete() {
    return (!this.data.roles || this.currentData.role) && this.currentData.address.type
      && this.currentData.address.address1 && this.currentData.address.postCode && this.currentData.address.city;
  }

  isAddressChanged() {
    return this.currentData.address.type !== this.data.defaultData.address.type || this.currentData.address.address1 !== this.data.defaultData.address.address1 || this.currentData.address.address2 !== this.data.defaultData.address.address2
      || this.currentData.address.postCode !== this.data.defaultData.address.postCode || this.currentData.address.city !== this.data.defaultData.address.city || this.currentData.address.gpsCoordinates !== this.data.defaultData.address.gpsCoordinates
      || this.currentData.address.inseeCoordinates !== this.data.defaultData.address.inseeCoordinates || this.currentData.address.dispatch !== this.data.defaultData.address.dispatch
      || this.currentData.address.wayType !== this.data.defaultData.address.wayType || this.currentData.address.staircase !== this.data.defaultData.address.staircase
      || (this.data.roles && this.currentData.role !== this.data.defaultData.role);
  }

  getAddress(streetNumber: string, street: string) {
    return street ? (streetNumber ? streetNumber + ' ' + street : street) : "";
  }

  searchLocation(text: string) {
    if (text && text.length > 5) {
      this.locationService.search(text, '5', 'FR', 'fromLabel').subscribe((results) => {
        this.suggestedLocation = results.map((result) => result);
      });
    } else {
      this.suggestedLocation = [];
    }
  }

  addAddress() {
    this.saving = true;
    this.addressesService.add(this.currentData.address).subscribe((newUuid) => {
      if (!newUuid || !newUuid.uuid) {
        console.log("An error occurred while adding new address");
      } else {
        this.currentData.address.uuid = newUuid.uuid;
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  updateAddress() {
    this.saving = true;
    this.addressesService.update(this.currentData.address).subscribe((updatedAddress) => {
      if (!updatedAddress) {
        console.log("An error occurred while updating address " + this.currentData.address.uuid);
      } else {
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = AddressUtils.buildAddressWithRole(this.currentData.address, this.addressForm.getRawValue().role);
    this.addressSaved.emit(AddressUtils.buildAddressWithRole(this.currentData.address, this.addressForm.getRawValue().role));
  }

  delete(address: AddressWithRole) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeAddress.emit(address);
      }
    });
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  setAddress(address: Location) {
    this.addressForm.get('postCode').setValue(address.postCode);
    this.addressForm.get('city').setValue(address.county);
  }
}

export interface AddressFormData {
  mode: AddressFormMode | string; // Display mode
  disabled?: boolean;             // Disable fields
  disabledRole?: boolean;         // Disable role field
  deletable?: boolean;            // Show delete button
  inStep?: boolean;               // If displayed in another stepper
  roles?: string[];               // List of available roles
  types?: AddressType[];          // List of available types
  defaultData?: AddressWithRole;  // Default data
}

export enum AddressFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
