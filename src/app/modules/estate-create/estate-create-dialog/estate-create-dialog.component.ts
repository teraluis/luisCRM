import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {EstateCreateData} from "../estate-create.component";
import {Estate} from "../../../services/backend/estates.service";

@Component({
  selector: 'app-estate-create-dialog',
  templateUrl: './estate-create-dialog.component.html'
})
export class EstateCreateDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: EstateCreateData,
              public dialogRef: MatDialogRef<EstateCreateDialogComponent>) {
  }

  close(estate: Estate) {
    this.dialogRef.close(estate);
  }
}


