import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {AccountWithRole} from "../../../services/backend/accounts.service";
import {AccountFormData, AccountFormMode} from "../account-form.component";

@Component({
  selector: 'app-account-form-dialog',
  templateUrl: './account-form-dialog.component.html'
})
export class AccountFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: AccountFormData,
              public dialogRef: MatDialogRef<AccountFormDialogComponent>) {
  }

  close(account: AccountWithRole) {
    this.dialogRef.close(account);
  }

  getTitle() {
    switch (this.data.mode) {
      case AccountFormMode.CREATE:
        return 'Créer un nouveau compte';
      case AccountFormMode.EDIT:
        return this.data.disabled ? 'Consulter un compte' : 'Modifier un compte';
      case AccountFormMode.SEARCH:
        return 'Rechercher un compte';
      case AccountFormMode.CREATE_OR_SEARCH:
        return 'Ajouter un compte';
      default:
        return 'Compte';
    }
  }
}
