import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {LocalityFormData, LocalityFormMode} from "../estate-form-locality.component";
import {Locality} from "../../../services/backend/estates.service";

@Component({
  selector: 'app-estate-form-locality-dialog',
  templateUrl: './estate-form-locality-dialog.component.html'
})
export class EstateFormLocalityDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: LocalityFormData,
              public dialogRef: MatDialogRef<EstateFormLocalityDialogComponent>) {
  }

  close(locality: Locality) {
    this.dialogRef.close(locality);
  }

  getTitle() {
    switch (this.data.mode) {
      case LocalityFormMode.CREATE:
        return 'Créer un nouveau bâtiment';
      case LocalityFormMode.EDIT:
        return this.data.disabled ? 'Consulter un bâtiment' : 'Modifier un bâtiment';
      default:
        return 'Bâtiment';
    }
  }
}
