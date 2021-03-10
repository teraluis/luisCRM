import {Component, EventEmitter, Input} from "@angular/core";
import {ColumnInformation, FilterType, TableLine, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {SidePanelType} from "../../../services/front/sidepanel.service";
import {Order, OrdersService} from "../../../services/backend/orders.service";
import {OrderStatus, OrderUtils} from "../../utils/order-utils";
import {Account} from "../../../services/backend/accounts.service";

@Component({
  selector: 'app-account-orders',
  templateUrl: './account-orders.component.html'
})
export class AccountOrdersComponent implements TableSearchListInterface {

  @Input() account: Account;
  @Input() disabled: boolean;

  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.PREVIEW];
  displayedColumns = ['name', 'clientName', 'market', 'referenceNumber', 'status', 'created'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Commande', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'order/:id', maxWidthPx: 120},
    {name: this.displayedColumns[1], title: 'Établissement', filterType: FilterType.TEXT, filterDisabled: false, routerLink: (e) => (e.isEstablishment ? 'establishments' : 'comptes') + '/:clientId'},
    {name: this.displayedColumns[2], title: 'Marché', filterType: FilterType.MARKET, filterDisabled: false, routerLink: () => 'market/:marketId'},
    {name: this.displayedColumns[3], title: 'Bon de commande', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Statut', filterType: FilterType.STATUS, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Date de création', filterType: FilterType.DATE, filterDisabled: true}
  ];
  maxRows = 10;
  sidePanelType = SidePanelType.ORDER;
  dataSourceChange = new EventEmitter<any>();

  constructor(protected ordersService: OrdersService,
              protected dialog: MatDialog) {
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.ordersService.getFromAccount(this.account.uuid).subscribe((orders) => {
      const dataSource = new MatTableDataSource<AccountOrderTableLine>(this.buildOrderTableLine(orders));
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildOrderTableLine(orders: Order[]) {
    let i = 1;
    return orders.map(order => {
      const data: AccountOrderTableLine = {
        id: order.uuid,
        name: order.name,
        clientName: order.establishment && order.establishment.establishment ? order.establishment.establishment.name : 'Liée à ce compte',
        clientId: order.establishment ? order.establishment.establishment.uuid : order.account.uuid,
        isEstablishment: !!order.establishment,
        market: order.market ? order.market.name : null,
        marketId: order.market ? order.market.uuid : null,
        status: OrderUtils.getStatus(order.status),
        position: i,
        referenceNumber: order.referenceNumber,
        created: order.created
      };
      i++;
      return data;
    });
  }

  getRouterLink = (columnName: string, row: AccountOrderTableLine) => {
    switch (columnName) {
      case 'name':
        return ['/orders', row.id];
      case 'clientName':
        if (row.clientId !== this.account.uuid) {
          return ['/establishments', row.clientId];
        }
        break;
      case 'market':
        return ['/market', row.marketId];
      default:
        return ['/orders', row.id];
    }
  }

  getStatusList = () => {
    const result = [];
    Object.values(OrderStatus).forEach(e => {
      if (!isNaN(Number(e))) {
        result.push({name: e, value: OrderUtils.getStatusName(e)});
      }
    });
    return result;
  }

  getStatusColor = (key: number) => {
    return OrderUtils.getStatusColor(key);
  }

  getStatusName = (key: number) => {
    return OrderUtils.getStatusName(key);
  }
}

export interface AccountOrderTableLine extends TableLine {
  name: string;
  referenceNumber: string;
  clientName: string;
  clientId: string;
  market: string;
  marketId: string;
  status: number;
  created: number;
  isEstablishment: boolean;
}
