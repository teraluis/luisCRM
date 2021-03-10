import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {AnnexFormData, AnnexFormMode} from "../estate-form-annex.component";
import {Annex} from "../../../services/backend/estates.service";

@Component({
  selector: 'app-estate-form-annex-dialog',
  templateUrl: './estate-form-annex-dialog.component.html'
})
export class EstateFormAnnexDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: AnnexFormData,
              public dialogRef: MatDialogRef<EstateFormAnnexDialogComponent>) {
  }

  close(annex: Annex) {
    this.dialogRef.close(annex);
  }

  getTitle() {
    switch (this.data.mode) {
      case AnnexFormMode.CREATE:
        return 'Créer une nouvelle annexe';
      case AnnexFormMode.EDIT:
        return this.data.disabled ? 'Consulter une annexe' : 'Modifier une annexe';
      default:
        return 'Annexe';
    }
  }
}


