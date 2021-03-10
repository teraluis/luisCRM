import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {AddressWithRole} from "../../../services/backend/addresses.service";
import {AddressFormData, AddressFormMode} from "../address-form.component";

@Component({
  selector: 'app-address-form-dialog',
  templateUrl: './address-form-dialog.component.html'
})
export class AddressFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: AddressFormData,
              public dialogRef: MatDialogRef<AddressFormDialogComponent>) {
  }

  close(address: AddressWithRole) {
    this.dialogRef.close(address);
  }

  getTitle() {
    switch (this.data.mode) {
      case AddressFormMode.CREATE:
        return 'Créer une nouvelle adresse';
      case AddressFormMode.EDIT:
        return this.data.disabled ? 'Consulter une adresse' : 'Modifier une adresse';
      default:
        return 'Adresse';
    }
  }
}
