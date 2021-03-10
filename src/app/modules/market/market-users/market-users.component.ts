import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {
  ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {MatDialog} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {ConfirmationComponent} from '../../confirmation/confirmation.component';
import {InfoService} from '../../../services/front/info.service';
import {IMarket, MarketsService, MarketUser, MarketUserRole} from '../../../services/backend/markets.service';
import {UserFormDialogComponent} from '../../user-form/user-form-dialog/user-form-dialog.component';
import {User, UserWithRole} from '../../../services/backend/users.service';
import {UserFormData, UserFormMode} from '../../user-form/user-form.component';
import {SidePanelType} from '../../../services/front/sidepanel.service';

@Component({
  selector: 'app-market-users',
  templateUrl: './market-users.component.html'
})
export class MarketUsersComponent implements OnInit, TableSearchListInterface {

  @Input() market: IMarket;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['role', 'name', 'phone', 'email', 'office', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Rôle', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Téléphone', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100},
    {name: this.displayedColumns[3], title: 'Email', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Agence', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 150},
    {name: this.displayedColumns[5], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false},
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;
  users: UserWithRole[];

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
    this.marketsService.getUser(this.market.uuid).subscribe((users) => {
      this.users = users.map(user => User.buildUserWithRole(user.user, user.role));
      const dataSource = new MatTableDataSource<MarketUserTableLine>(this.buildMarketContactTableLine(this.users));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildMarketContactTableLine(users: UserWithRole[]) {
    let i = 1;
    return users.map(uwr => {
      const isUniqueCommercial = uwr.role === MarketUserRole.COMMERCIAL && users.filter(u => u.role === MarketUserRole.COMMERCIAL).length === 1;
      const data: MarketUserTableLine = {
        position: i,
        deletable: !this.disabled && !isUniqueCommercial,
        id: uwr.user.login,
        role: uwr.role,
        name: uwr.user.first_name + ' ' + uwr.user.last_name.toUpperCase(),
        phone: uwr.user.phone,
        email: uwr.user.login,
        office: uwr.user.office,
        description: uwr.user.description,
        actionDisabled: this.disabled
      };
      i++;
      return data;
    });
  }

  getComboList = () => {
    return {role: Object.values(MarketUserRole)};
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: MarketUserTableLine = actionEvent.event;
    const user: UserWithRole = this.users.find(c => c.user.login === event.id);
    if (actionEvent.action === ActionType.EDIT) {
      const isUniqueCommercial = user.role === MarketUserRole.COMMERCIAL && this.users.filter(u => u.role === MarketUserRole.COMMERCIAL).length === 1;
      const data: UserFormData = {
        mode: UserFormMode.SEARCH,
        disabled: this.disabled,
        disabledRole: isUniqueCommercial,
        disableUser: true,
        roles: Object.values(MarketUserRole),
        defaultData: user
      };
      const dialogRef = this.dialog.open(UserFormDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogRef.afterClosed().subscribe((resp: UserWithRole) => {
        if (resp) {
          this.marketsService.updateUser(new MarketUser(this.market, resp.user, resp.role)).subscribe((done) => {
            if (done) {
              this.infoService.displaySaveSuccess();
              this.setFilterData('');
            }
          });
        }
      });
    } else if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir enlever le lien avec ce contact ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.marketsService.deleteUser(this.market.uuid, user.user.login).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.setFilterData('');
            }
          });
        }
      });
    }
  }
}

export interface MarketUserTableLine extends DeletableTableLine {
  role: string;
  name: string;
  phone: string;
  email: string;
  office?: string;
  description?: string;
}
