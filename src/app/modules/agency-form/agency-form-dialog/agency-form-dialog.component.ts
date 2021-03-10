import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IAgency} from "../../../services/backend/agency.service";
import {AgencyFormData, AgencyFormMode} from "../agency-form.component";

@Component({
  selector: 'app-agency-form-dialog',
  templateUrl: './agency-form-dialog.component.html'
})
export class AgencyFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: AgencyFormData,
              public dialogRef: MatDialogRef<AgencyFormDialogComponent>) {
  }

  close(agency: IAgency) {
    this.dialogRef.close(agency);
  }

  getTitle() {
    switch (this.data.mode) {
      case AgencyFormMode.CREATE:
        return 'Créer une nouvelle agence';
      case AgencyFormMode.EDIT:
        return this.data.disabled ? 'Consulter une agence' : 'Modifier une agence';
      default:
        return 'Agence';
    }
  }
}
