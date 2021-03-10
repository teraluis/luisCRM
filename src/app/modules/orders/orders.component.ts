import {Component, ViewChild} from '@angular/core';
import {MatDialog, PageEvent} from '@angular/material';
import {OrdersService} from '../../services/backend/orders.service';
import {OrderCreateDialogComponent} from '../order-create-dialog/order-create-dialog.component';
import {Router} from '@angular/router';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {
  Action,
  ActionType,
  ColumnInfo,
  CustomDatasource,
  FilterType,
  GlobalAction,
  GlobalActionType,
  Sort
} from '../../core/datagrid';
import {NewOrder} from './new-order';
import {OrderStatus} from '../utils/order-utils';
import * as moment from 'moment';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {

  @ViewChild('sidePanel') sidePanel: SidePanelComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Particulier');

  action = false;
  dataSourceTable: CustomDatasource<NewOrder>;
  dataSourceSidePanel: CustomDatasource<NewOrder>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {name: 'name', title: 'Commande', filterType: FilterType.TEXT, routerLink: () => 'orders/:id', maxWidthPx: 120},
    {name: 'status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status},
    {name: 'created', title: 'Date de création', filterType: FilterType.DATETIME},
    {name: 'account.name', title: 'Compte', filterType: FilterType.TEXT, routerLink: () => 'comptes/:account.id'},
    {name: 'market.name', title: 'Marché', filterType: FilterType.TEXT, routerLink: () => 'market/:market.id', unclick: (elem) => !elem.market},
    {name: 'referenceNumber', title: 'Bon de commande', filterType: FilterType.TEXT},
    // {name: 'nbEstate', title: 'Nb. bien', filterType: FilterType.NUMBER, maxWidthPx: 90},
  ];

  datagridAction: Action[] = [
    {type: ActionType.PREVIEW, click: (elem) => this.setPreview(elem)}
  ];

  datagridGlobalAction: GlobalAction[] = [
    {type: GlobalActionType.EXPORT}
  ];

  actionData: PlusActionData[] = [
    {
      label: 'Ajouter une commande',
      icon: 'add',
      function: () => this.createOrder()
    }
  ];

  constructor(private router: Router, protected ordersService: OrdersService, protected dialog: MatDialog) {
    this.dataSourceTable = new CustomDatasource<NewOrder>(this.ordersService);
    this.dataSourceSidePanel = new CustomDatasource<NewOrder>(this.ordersService);
    this.status[OrderStatus[OrderStatus.FILLED]] = {colorClass: 'green', value: 'Commande renseignée'};
    this.status[OrderStatus[OrderStatus.PRODUCTION]] = {colorClass: 'green', value: 'Commande en production'};
    this.status[OrderStatus[OrderStatus.HONORED]] = {colorClass: 'green', value: 'Commande honorée'};
    this.status[OrderStatus[OrderStatus.CLOSED]] = {colorClass: 'green', value: 'Commande clôturée'};
    this.status[OrderStatus[OrderStatus.RECEIVED]] = {colorClass: 'warn', value: 'Commande reçue'};
    this.status[OrderStatus[OrderStatus.BILLABLE]] = {colorClass: 'warn', value: 'Commande facturable'};
    this.status[OrderStatus[OrderStatus.CANCELED]] = {colorClass: 'red', value: 'Commande annulée'};
  }

  setPreview(elem: NewOrder) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewOrder) {
    console.log(elem);
    this.sidePanelContent.element = [];
    if (elem.market) {
      this.sidePanelContent.element.push({
        title: 'Compte',
        content: [
          {label: 'Compte', value: elem.name, routerLink: 'orders/' + elem.id},
          {label: 'Marché', value: elem.market.name + (elem.market.marketNumber ? ' - ' + elem.market.marketNumber : '')}
        ]
      });
    } else {
      this.sidePanelContent.element.push({
        title: 'Compte',
        content: [
          {label: 'Compte', value: elem.name, routerLink: 'orders/' + elem.id}
        ]
      });
    }

    if (elem.establishment) {
      this.sidePanelContent.element[0].content.push(
        {label: 'Établissement', value: elem.establishment.name},
        {label: 'Adresse de facturation', value: elem.establishment.address},
        {label: 'Donneur d\'ordre', value: elem.purchaser.name}
      );
    } else {
      this.sidePanelContent.element[0].content.push(
        {label: 'Adresse de facturation', value: elem.address},
      );
    }
    if (elem.commercial) {
      this.sidePanelContent.element[0].content.push({label: 'Commercial', value: elem.commercial});
    }

    this.sidePanelContent.element.push({
      title: 'Description',
      content: [
        {label: 'No. bon de commande client', value: elem.referenceNumber},
      ]
    });

    if (elem.receive) {
      this.sidePanelContent.element[1].content.push({
        label: 'Date de réception',
        value: moment(elem.receive).format('DD/MM/YYYY')
      });
    }

    if (elem.delivery) {
      this.sidePanelContent.element[1].content.push({
        label: 'Date limite de livraison',
        value: moment(elem.delivery).format('DD/MM/YYYY')
      });
    }
    if (elem.visit) {
      this.sidePanelContent.element[1].content.push({
        label: 'Date de visite conseil',
        value: moment(elem.visit).format('DD/MM/YYYY')
      });
    }
    if (elem.assessment) {
      this.sidePanelContent.element[1].content.push({
        label: 'Date de l\'état des lieux',
        value: moment(elem.assessment).format('DD/MM/YYYY')
      });
    }

    this.sidePanelContent.element.push({
      title: 'Biens',
      content: [
        {label: 'Nombre de biens', value: elem.nbEstate},
        {label: 'Référence des biens', value: elem.estateRefs},
      ]
    });

    if (elem.prestations && Object.keys(elem.prestations).length) {
      const content = Object.keys(elem.prestations).map(k => {
        return {label: k, value: elem.prestations[k]};
      });

      this.sidePanelContent.element.push({
        title: 'Prestations',
        content
      });
    }
  }

  createOrder() {
    this.dialog.open(OrderCreateDialogComponent, {
      width: '60%'
    });
  }
}
