import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ReportDestination} from "../../../services/backend/orders.service";
import {ReportDestinationFormData, ReportDestinationFormMode} from "../report-destination-form.component";

@Component({
  selector: 'app-report-destination-form-dialog',
  templateUrl: './report-destination-form-dialog.component.html'
})
export class ReportDestinationFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReportDestinationFormData,
              public dialogRef: MatDialogRef<ReportDestinationFormDialogComponent>) {
  }

  close(repDest: ReportDestination) {
    this.dialogRef.close(repDest);
  }

  getTitle() {
    switch (this.data.mode) {
      case ReportDestinationFormMode.CREATE:
        return 'Ajouter un contact d\'envoi du rapport';
      case ReportDestinationFormMode.EDIT:
        return this.data.disabled ? 'Consulter un contact d\'envoi du rapport' : 'Modifier un contact d\'envoi du rapport';
      default:
        return 'Contact d\'envoie du rapport';
    }
  }
}
