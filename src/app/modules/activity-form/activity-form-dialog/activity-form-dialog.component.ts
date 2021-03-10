import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IActivity} from "../../../services/backend/activity.service";
import {ActivityFormData, ActivityFormMode} from "../activity-form.component";

@Component({
  selector: 'app-activity-create-dialog',
  templateUrl: './activity-form-dialog.component.html'
})
export class ActivityFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: ActivityFormData,
              public dialogRef: MatDialogRef<ActivityFormDialogComponent>) {
  }

  close(activity: IActivity) {
    this.dialogRef.close(activity);
  }

  getTitle() {
    switch (this.data.mode) {
      case ActivityFormMode.CREATE:
        return 'Créer une nouvelle activité';
      case ActivityFormMode.EDIT:
        return this.data.disabled ? 'Consulter une activité' : 'Modifier une activité';
      default:
        return 'Activité';
    }
  }
}
