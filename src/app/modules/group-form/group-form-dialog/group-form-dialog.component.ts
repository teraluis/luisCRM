import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {GroupFormData, GroupFormMode} from "../group-form.component";
import {IGroup} from "../../../services/backend/group.service";

@Component({
  selector: 'app-group-form-dialog',
  templateUrl: './group-form-dialog.component.html'
})
export class GroupFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: GroupFormData,
              public dialogRef: MatDialogRef<GroupFormDialogComponent>) {
  }

  close(group: IGroup) {
    this.dialogRef.close(group);
  }

  getTitle() {
    switch (this.data.mode) {
      case GroupFormMode.CREATE:
        return 'Créer un nouveau groupe';
      case GroupFormMode.EDIT:
        return this.data.disabled ? 'Consulter un groupe' : 'Modifier un groupe';
      default:
        return 'Groupe';
    }
  }
}
