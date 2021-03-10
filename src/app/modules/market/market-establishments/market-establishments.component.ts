import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {
  ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {MatDialog} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {InfoService} from '../../../services/front/info.service';
import {ConfirmationComponent} from '../../confirmation/confirmation.component';
import {AccountUtils} from '../../utils/account-utils';
import {PeopleUtils} from '../../utils/people-utils';
import {AccountStatus, AccountWithRole} from '../../../services/backend/accounts.service';
import {IMarket, IMarketEstablishment, MarketEstablishmentRole, MarketsService} from '../../../services/backend/markets.service';
import {EstablishmentWithRole} from '../../../services/backend/establishments.service';

@Component({
  selector: 'app-market-establishments',
  templateUrl: './market-establishments.component.html'
})
export class MarketEstablishmentsComponent implements OnInit, TableSearchListInterface {

  @Input() market: IMarket;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.DELETE];
  displayedColumns = ['name', 'role', 'contact'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'establishments/:id'},
    {name: this.displayedColumns[1], title: 'Rôle', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Contact principal', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;
  establishments: IMarketEstablishment[];

  constructor(private marketsService: MarketsService,
              private infoService: InfoService,
              protected dialog: MatDialog) {
  }

  ngOnInit() {
    this.update.subscribe(() => this.setFilterData(''));
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.marketsService.getEstablishments(this.market.uuid).subscribe((establishments) => {
      this.establishments = establishments;
      const dataSource = new MatTableDataSource<MarketEstablishmentTableLine>(this.buildEstablishmentTableLine(this.establishments));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildEstablishmentTableLine(establishments: IMarketEstablishment[]) {
    let i = 1;
    return establishments.map(establishment => {
      const isUniqueClient = establishment.role === MarketEstablishmentRole.CLIENT && this.establishments.filter(a => a.role === MarketEstablishmentRole.CLIENT).length === 1;
      const data: MarketEstablishmentTableLine = {
        position: i,
        deletable: !this.disabled && !isUniqueClient,
        id: establishment.establishment.uuid,
        name: establishment.establishment.name,
        role: establishment.role,
        contact: establishment.establishment.contact ? PeopleUtils.getName(establishment.establishment.contact) : 'Aucun contact principal',
        actionDisabled: this.disabled
      };
      i++;
      return data;
    });
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: MarketEstablishmentTableLine = actionEvent.event;
    const establishment: IMarketEstablishment = this.establishments.find(a => a.establishment.uuid === event.id && a.role === event.role);
    if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir enlever le lien avec cet établissement ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.marketsService.deleteEstablishment(this.market.uuid, establishment.establishment.uuid,  establishment.role).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.setFilterData('');
            }
          });
        }
      });
    }
  }

  getComboList = () => {
    return {role: Object.values(MarketEstablishmentRole)};
  }

  getRouterLink = (columnName: string, row: MarketEstablishmentTableLine) => {
    return ['/establishments', row.id];
  }
}

export interface MarketEstablishmentTableLine extends DeletableTableLine {
  name: string;
  role: string;
  contact: string;
}
