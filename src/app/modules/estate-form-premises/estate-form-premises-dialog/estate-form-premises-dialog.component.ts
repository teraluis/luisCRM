import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {PremisesFormData, PremisesFormMode} from "../estate-form-premises.component";
import {Premises} from "../../../services/backend/estates.service";

@Component({
  selector: 'app-estate-form-premises-dialog',
  templateUrl: './estate-form-premises-dialog.component.html'
})
export class EstateFormPremisesDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: PremisesFormData,
              public dialogRef: MatDialogRef<EstateFormPremisesDialogComponent>) {
  }

  close(premises: Premises) {
    this.dialogRef.close(premises);
  }

  getTitle() {
    switch (this.data.mode) {
      case PremisesFormMode.CREATE:
        return 'Créer un nouveau local';
      case PremisesFormMode.EDIT:
        return this.data.disabled ? 'Consulter un local' : 'Modifier un local';
      default:
        return 'Local';
    }
  }
}


