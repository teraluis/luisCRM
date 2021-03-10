import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {EstablishmentWithRole} from "../../../services/backend/establishments.service";
import {EstablishmentFormData, EstablishmentFormMode} from "../establishment-form.component";

@Component({
  selector: 'app-establishment-form-dialog',
  templateUrl: './establishment-form-dialog.component.html'
})
export class EstablishmentFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: EstablishmentFormData,
              public dialogRef: MatDialogRef<EstablishmentFormDialogComponent>) {
  }

  close(establishment: EstablishmentWithRole) {
    this.dialogRef.close(establishment);
  }

  getTitle() {
    switch (this.data.mode) {
      case EstablishmentFormMode.CREATE:
        return 'Créer un nouvel établissement';
      case EstablishmentFormMode.EDIT:
        return this.data.disabled ? 'Consulter un établissement' : 'Modifier un établissement';
      case EstablishmentFormMode.SEARCH:
        return 'Rechercher un établissement';
      default:
        return 'Établissement';
    }
  }
}
