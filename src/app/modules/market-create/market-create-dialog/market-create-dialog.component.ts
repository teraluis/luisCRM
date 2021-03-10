import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IMarket} from "../../../services/backend/markets.service";
import {MarketCreateData, MarketFormMode} from "../market-create.component";

@Component({
  selector: 'app-market-create-dialog',
  templateUrl: './market-create-dialog.component.html'
})
export class MarketCreateDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: MarketCreateData,
              public dialogRef: MatDialogRef<MarketCreateDialogComponent>) {
  }

  close(market: IMarket) {
    this.dialogRef.close(market);
  }

  getTitle() {
    switch (this.data.mode) {
      case MarketFormMode.CREATE:
        return 'Créer un nouveau marché';
      case MarketFormMode.EDIT:
        return this.data.disabled ? 'Consulter un marché' : 'Modifier un marché';
      default:
        return 'Marché';
    }
  }
}
