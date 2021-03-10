import {Component, EventEmitter, Input} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import * as moment from 'moment';
import {ColumnInformation, FilterType, TableLine, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {SidePanelType} from "../../../services/front/sidepanel.service";
import {NavigationService} from "../../../services/front/navigation.service";
import {IMarket, MarketsService} from "../../../services/backend/markets.service";
import {MarketCreateData, MarketFormMode} from "../../market-create/market-create.component";
import {MarketCreateDialogComponent} from "../../market-create/market-create-dialog/market-create-dialog.component";
import {FullEstablishment} from "../../../services/backend/establishments.service";

@Component({
  selector: 'app-establishment-markets',
  templateUrl: './establishment-markets.component.html'
})
export class EstablishmentMarketsComponent implements TableSearchListInterface {

  @Input() full: FullEstablishment;
  @Input() disabled: boolean;

  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.PREVIEW];
  displayedColumns = ['name', 'marketNumber', 'startDate', 'duration', 'customerRequirement', 'estimateVolume'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'market/:id'},
    {name: this.displayedColumns[1], title: 'Référence', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Date début', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Durée', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Type de besoin client', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Estimation de volume', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  sidePanelType = SidePanelType.MARKET;
  dataSourceChange = new EventEmitter<any>();
  createAction = {label: 'Créer un marché', disabled: false, hidden: false, create: () => this.createMarket()};

  constructor(private navigationService: NavigationService,
              protected marketService: MarketsService,
              protected dialog: MatDialog,
              private router: Router) {
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.marketService.getAllFromEstablishment(this.full.establishment.uuid).subscribe((markets) => {
      const dataSource = new MatTableDataSource<MarketsTableLine>(this.buildMarketTableLine(markets));
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildMarketTableLine(markets: IMarket[]) {
    let i = 1;
    return markets.map((market: IMarket) => {
      const data: MarketsTableLine = {
        position: i,
        id: market.uuid,
        name: market.name,
        marketNumber: market.marketNumber,
        startDate: this.formatDate(market.startDate),
        duration: market.duration,
        customerRequirement: market.customerRequirement,
        estimateVolume: market.estimateVolume,
        receiveDate: this.formatDate(market.receiveDate),
        responseDate: this.formatDate(market.responseDate),
        returnDate: this.formatDate(market.returnDate),
        publicationNumber: market.publicationNumber,
        origin: market.origin
      };
      i++;
      return data;
    });
  }

  createMarket() {
    const data: MarketCreateData = {
      mode: MarketFormMode.CREATE,
      defaultClient: this.full
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(MarketCreateDialogComponent, {
      data: data,
      width: '40%'
    });

    addDialogRef.afterClosed().subscribe((newMarket: IMarket) => {
      if (newMarket && newMarket.uuid) {
        this.router.navigate(['/market/' + newMarket.uuid]);
      }
    });
  }

  private formatDate(date: string | Date): string | null {
    return date ? moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY') : null;
  }

  getRouterLink = (columnName: string, row: MarketsTableLine) => {
    return ['/market', row.id];
  }
}

export interface MarketsTableLine extends TableLine {
  name: string;
  marketNumber: string;
  startDate: string;
  duration: number;
  customerRequirement: string;
  estimateVolume: string;
  receiveDate: string;
  responseDate: string;
  returnDate: string;
  publicationNumber: string;
  origin: string;
}
