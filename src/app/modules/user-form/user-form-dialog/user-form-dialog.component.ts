import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserWithRole} from "../../../services/backend/users.service";
import {UserFormData, UserFormMode} from "../user-form.component";

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html'
})
export class UserFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserFormData,
              public dialogRef: MatDialogRef<UserFormDialogComponent>) {
  }

  close(user: UserWithRole) {
    this.dialogRef.close(user);
  }

  getTitle() {
    switch (this.data.mode) {
      case UserFormMode.CREATE:
        return 'Créer un nouvel utilisateur';
      case UserFormMode.EDIT:
        return this.data.disabled ? 'Consulter un utilisateur' : 'Modifier un utilisateur';
      case UserFormMode.SEARCH:
        return 'Rechercher un utilisateur';
      default:
        return 'Utilisateur';
    }
  }
}
