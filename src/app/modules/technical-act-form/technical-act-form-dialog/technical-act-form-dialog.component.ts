import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {TechnicalActFormData, TechnicalActFormMode} from "../technical-act-form.component";
import {ITechnicalAct} from "../../../services/backend/technical-act.service";

@Component({
  selector: 'app-technical-act-form-dialog',
  templateUrl: './technical-act-form-dialog.component.html'
})
export class TechnicalActFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: TechnicalActFormData,
              public dialogRef: MatDialogRef<TechnicalActFormDialogComponent>) {
  }

  close(act: ITechnicalAct) {
    this.dialogRef.close(act);
  }

  getTitle() {
    switch (this.data.mode) {
      case TechnicalActFormMode.CREATE:
        return 'Créer un nouvel acte technique';
      case TechnicalActFormMode.EDIT:
        return this.data.disabled ? 'Consulter un acte technique' : 'Modifier un acte technique';
      default:
        return 'Acte technique';
    }
  }
}
