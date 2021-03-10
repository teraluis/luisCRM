import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {EstateEditData, OrderSelection} from "../estate-edit.component";

@Component({
  selector: 'app-estate-edit-dialog',
  templateUrl: './estate-edit-dialog.component.html'
})
export class EstateEditDialogComponent {
  returnValue: EstateEditReturnValue = {
    selection: undefined,
    hasChanged: false
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: EstateEditData,
              public dialogRef: MatDialogRef<EstateEditDialogComponent>) {
    data.dialogMode = true;
    dialogRef.beforeClosed().subscribe(() => {
      dialogRef.close(this.returnValue);
    });
  }

  close(selection: OrderSelection) {
    this.returnValue.selection = selection;
    this.dialogRef.close(this.returnValue);
  }
}

export interface EstateEditReturnValue {
  selection: OrderSelection;
  hasChanged: boolean;
}
