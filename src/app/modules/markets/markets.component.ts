import {Component, EventEmitter, OnInit} from '@angular/core';
import {FilterType, TableOption,
  TableSearchListInterface, ColumnInformation, DeletableTableLine
} from '../table-search-list/table-search-list.component';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {IMarket, MarketsService} from '../../services/backend/markets.service';
import {MatTableDataSource} from '@angular/material/table';
import {MarketCreateData} from '../market-create/market-create.component';
import {SidePanelType} from '../../services/front/sidepanel.service';
import * as moment from 'moment';
import {MarketCreateDialogComponent} from "../market-create/market-create-dialog/market-create-dialog.component";
import {PlusActionData} from "../plus-button/plus-button.component";
import {AgencyFormMode} from "../agency-form/agency-form.component";
import {ManagementRights} from '../../core/rights/ManagementRights';

@Component({
  selector: 'app-market-component',
  templateUrl: './markets.component.html'
})
export class MarketsComponent implements OnInit, TableSearchListInterface {
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
  action = false;
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un marché',
      icon: 'add',
      function: () => this.createMarket()
    }
  ];
  userRights = new ManagementRights();

  constructor(private navigationService: NavigationService, private router: Router, protected marketService: MarketsService, protected dialog: MatDialog) {
  }

  ngOnInit() {
    this.navigationService.set({menu: MenuStep.MARCHES, url: this.router.url});
  }

  setPageData(page: number) {
    this.isLoading.emit(true);
    this.marketService.getPage(page, this.maxRows).subscribe((orders) => {
      const dataSource = new MatTableDataSource<MarketsTableLine>(this.buildGroupTableLine(orders));
      this.dataSourceChange.emit({dataSource: dataSource, filter: null});
      this.isLoading.emit(false);
    });
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.marketService.getAll().subscribe((orders) => {
      const dataSource = new MatTableDataSource<MarketsTableLine>(this.buildGroupTableLine(orders));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildGroupTableLine(markets: any) {
    let i = 1;
    return markets.map((market: IMarket) => {
      const data: MarketsTableLine = {
        position: i,
        deletable: false,
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
      mode: AgencyFormMode.CREATE
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

export interface MarketsTableLine extends DeletableTableLine {
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
