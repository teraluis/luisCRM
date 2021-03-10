import {Component, EventEmitter, Input} from '@angular/core';
import {
  ColumnInformation, FilterType, TableLine, TableOption, TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {MatDialog} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {SidePanelType} from '../../../services/front/sidepanel.service';
import {Order, OrdersService} from '../../../services/backend/orders.service';
import {OrderStatus, OrderUtils} from '../../utils/order-utils';
import {OrderCreateData, OrderCreateDialogComponent} from '../../order-create-dialog/order-create-dialog.component';
import {FullEstablishment} from '../../../services/backend/establishments.service';

@Component({
  selector: 'app-establishment-orders',
  templateUrl: './establishment-orders.component.html'
})
export class EstablishmentOrdersComponent implements TableSearchListInterface {

  @Input() full: FullEstablishment;
  @Input() disabled: boolean;

  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.PREVIEW];
  displayedColumns = ['name', 'market', 'referenceNumber', 'status', 'created'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Commande', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'orders/:id', maxWidthPx: 120},
    {name: this.displayedColumns[1], title: 'Marché', filterType: FilterType.MARKET, filterDisabled: false, routerLink: () => 'market/:marketId'},
    {name: this.displayedColumns[2], title: 'Bon de commande', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Statut', filterType: FilterType.STATUS, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Date de création', filterType: FilterType.DATE, filterDisabled: true}
  ];
  maxRows = 10;
  sidePanelType = SidePanelType.ORDER;
  dataSourceChange = new EventEmitter<any>();
  createAction = {label: 'Créer une commande', disabled: false, hidden: false, create: () => this.createOrder()};

  constructor(protected ordersService: OrdersService,
              protected dialog: MatDialog) {
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.ordersService.getFromEstablishment(this.full.establishment.uuid).subscribe((orders) => {
      const dataSource = new MatTableDataSource<EstablishmentOrderTableLine>(this.buildOrderTableLine(orders));
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildOrderTableLine(orders: Order[]) {
    let i = 1;
    return orders.map(order => {
      const data: EstablishmentOrderTableLine = {
        id: order.uuid,
        name: order.name,
        market: order.market ? order.market.name : 'Aucun marché',
        marketId: order.market ?  order.market.uuid : '',
        status: OrderUtils.getStatus(order.status),
        position: i,
        referenceNumber: order.referenceNumber,
        created: order.created,
        unclickable: order.market ? null : this.displayedColumns[1]
      };
      i++;
      return data;
    });
  }

  createOrder() {
    const data: OrderCreateData = {
      defaultEstablishment: this.full
    };
    this.dialog.open(OrderCreateDialogComponent, {
      data: data,
      width: '40%'
    });
  }

  getRouterLink = (columnName: string, row: EstablishmentOrderTableLine) => {
    switch (columnName) {
      case 'name':
        return ['/orders', row.id];
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

export interface EstablishmentOrderTableLine extends TableLine {
  name: string;
  referenceNumber: string;
  market: string;
  marketId: string;
  status: number;
  created: number;
}
