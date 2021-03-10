import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {PeopleWithRole} from "../../../services/backend/people.service";
import {ContactFormData, ContactFormMode} from "../contact-form.component";

@Component({
  selector: 'app-contact-form-dialog',
  templateUrl: './contact-form-dialog.component.html'
})
export class ContactFormDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: ContactFormData,
              public dialogRef: MatDialogRef<ContactFormDialogComponent>) {
  }

  close(contact: PeopleWithRole) {
    this.dialogRef.close(contact);
  }

  getTitle() {
    switch (this.data.mode) {
      case ContactFormMode.CREATE:
        return 'Créer un nouveau contact';
      case ContactFormMode.EDIT:
        return this.data.disabled ? 'Consulter un contact' : 'Modifier un contact';
      case ContactFormMode.SEARCH:
        return 'Rechercher un contact';
      case ContactFormMode.CREATE_OR_SEARCH:
        return 'Ajouter un contact';
      default:
        return 'Contact';
    }
  }
}
