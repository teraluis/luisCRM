import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Bill, BillsService} from '../../services/backend/bills.service';
import {BillData, FullBill} from '../bill/bill.component';
import {Prestation} from '../../services/backend/prestations.service';
import {Order, OrdersService} from '../../services/backend/orders.service';
import {LineDraft} from '../billlines/billlines.component';
import {LinesService} from '../../services/front/lines.service';
import {SortService} from '../../services/front/sort.service';
import {BillModalComponent} from '../bill-modal/bill-modal.component';
import {NavigationService} from '../../services/front/navigation.service';
import {InfoService} from '../../services/front/info.service';
import {Router} from '@angular/router';
import {OrderStatusLabel} from '../utils/order-utils';
import {PlusActionData} from '../plus-button/plus-button.component';
import {FrontBillsService} from '../../services/front/bills.service';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {environment} from '../../../environments/environment';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {
  Action,
  ActionCustom,
  ColumnInfo,
  CustomDatasource,
  DatagridComponent,
  FilterType, GlobalAction, GlobalActionType,
  Sort
} from '../../core/datagrid';
import {NewBill} from './new-bill';
import {PageEvent} from '@angular/material/paginator';
import {InterventionsService, MaterializedIntervention} from '../../services/backend/interventions.service';
import {forkJoin} from 'rxjs';
import {NewAccount} from '../accounts/new-account';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss']
})
export class BillsComponent implements OnInit {

  @ViewChild('sidePanel') sidePanel: SidePanelComponent;
  @ViewChild(DatagridComponent) dataGrid: DatagridComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Compte');

  action = false;
  dataSourceTable: CustomDatasource<NewBill>;
  dataSourceSidePanel: CustomDatasource<NewBill>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {
      name: 'name', title: 'Facture', filterType: FilterType.TEXT, maxWidthPx: 110, clickable: elem => {
        this.setModal(elem);
        // this.router.navigate(['/orders/' + elem.id]);
      }
    },
    {name: 'status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status, maxWidthPx: 140},
    {name: 'exportDate', title: 'Date d\'export', filterType: FilterType.DATETIME},
    {
      name: 'order.name',
      title: 'Commande',
      filterType: FilterType.TEXT,
      routerLink: () => 'orders/:order.id',
      maxWidthPx: 110
    },
    {name: 'account.name', title: 'Compte', filterType: FilterType.TEXT, routerLink: () => 'comptes/:account.id'},
    {
      name: 'order.referenceNumber',
      title: 'Bon de commande',
      filterType: FilterType.TEXT,
      routerLink: () => 'orders/:order.id'
    },
    {name: 'market', title: 'Marché', filterType: FilterType.TEXT},
    {name: 'creditNote', title: 'Avoir', filterType: FilterType.TEXT, maxWidthPx: 110},
    {name: 'address', title: 'Adresse', filterType: FilterType.TEXT},
  ];

  datagridAction: Action[] = [
    new ActionCustom(elem => this.setModal(elem), 'open-popup', 'Ouvrir pop-up', 'launch', true),
    new ActionCustom(elem => this.setModal(elem), 'edit', 'Modifier la facture', '', false, () => null, (elem: NewBill) => elem.name && !elem.exportDate),
    new ActionCustom(elem => this.downloadPdf(elem), 'pdf', 'PDF', '', false, () => null, (elem: NewBill) => !!elem.name)
  ];

  actionData: PlusActionData[] = environment.production ? [] : [
    {
      label: 'Export vers Sage1000',
      icon: 'save_alt',
      function: () => this.exportBills()
    }
  ];

  datagridGlobalAction: GlobalAction[] = [
    {type: GlobalActionType.EXPORT}
  ];

  workInProgress = false;
  clickedPosition: number;
  production = environment.production;

  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();

  constructor(
    private infoService: InfoService,
    private navigationService: NavigationService,
    protected router: Router,
    private ordersService: OrdersService,
    private linesService: LinesService,
    private sortService: SortService,
    protected dialog: MatDialog,
    private frontBillsService: FrontBillsService,
    private service: BillsService,
    private interventionsService: InterventionsService
  ) {
    this.dataSourceTable = new CustomDatasource<NewBill>(this.service);
    this.dataSourceSidePanel = new CustomDatasource<NewBill>(this.service);
    this.status['pending'] = {colorClass: 'warn', value: 'À vérifier'};
    this.status['confirmed'] = {colorClass: 'blue', value: 'À facturer'};
    this.status['billed'] = {colorClass: 'green', value: 'À recouvrer'};
    this.status['cancelled'] = {colorClass: 'red', value: 'Facture annulée'};
    if (this.userRights.financialManagemement) {
      this.datagridAction.push(new ActionCustom(elem => {
          this.workInProgress = true;
          this.interventionsService.getFromOrder(elem.order.id)
            .pipe(switchMap(interventions => this.frontBillsService.generateAvoir(elem, interventions)))
            .subscribe((res) => {
              if (res) {
                this.dataGrid.loadPage();
              }
              this.workInProgress = false;
            });
        },
        'make-credit-note',
        'Faire un avoir',
        '',
        false,
        () => null,
        (elem: NewBill) => elem.name && elem.exportDate && elem.status !== 'confirmed'
      ));
    }
  }

  ngOnInit() {

  }

  setPreview(elem: NewAccount) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewAccount) {

  }

  exportBills() {
    if (!this.workInProgress) {
      this.workInProgress = true;
      this.service.triggerSage1000Export().subscribe((done) => {
        if (!done) {
          this.workInProgress = false;
        } else {
          this.infoService.displaySuccess('L\'export Sage1000 a été effectué !');
          this.workInProgress = false;
          this.dataGrid.loadPage();
        }
      });
    }
  }

  removeBill(line: NewBill) {
    this.workInProgress = true;
    this.service.delete(line.id).subscribe((res) => {
      if (!res) {
        this.workInProgress = false;
      } else {
        this.ordersService.setStatus(line.order.id, OrderStatusLabel.BILLABLE).subscribe((done) => {
          this.dataGrid.loadPage();
          this.workInProgress = false;
        });
      }
    });
  }

  setModal(line: NewBill) {
    // this.clickedPosition = line.position;
    // const order = line.order;
    const orderLines = [];
    const prestations: Prestation[] = [];
    forkJoin(
      this.interventionsService.getFromOrder(line.order.id),
      this.ordersService.getOne(line.order.id),
      this.service.getOne(line.id)
    ).subscribe(([interventionList, order, bill]: [Array<MaterializedIntervention>, Order, Bill]) => {
      interventionList.forEach(intervention => {
        const int = intervention.asIncomplete();
        if (int) {
          int.prestations.forEach(prestation => {
            prestations.push(prestation);
          });
        }
      });
      const lineIds = prestations.map(p => p.orderLine);
      prestations.filter(p => p.analyse && p.analyse.orderLineId).map(p => p.analyse).forEach(analyse => lineIds.push(analyse.orderLineId));
      const lines = order.orderLines.filter(o => lineIds.includes(o.uuid));
      for (const orderLine of lines) {
        const linePrestations: Prestation[] = prestations.filter(p => p.technicalAct && p.orderLine === orderLine.uuid);
        const orderLineDraft = new LineDraft(orderLine.uuid, linePrestations, orderLine.refadx, linePrestations.length === 0);
        orderLineDraft.designation = orderLine.designation;
        orderLineDraft.refBpu = orderLine.refbpu;
        orderLineDraft.unitPrice = orderLine.price;
        orderLineDraft.quantity = orderLine.quantity;
        orderLineDraft.discount = orderLine.discount;
        orderLineDraft.checkNumber();
        orderLines.push(orderLineDraft);
      }
      orderLines.sort((a, b) => {
        return this.sortService.sortOrderLineDraft(a, b);
      });
      if (line.status === 'pending') {
        this.linesService.getTotalAnalyseCount(prestations).subscribe((analyseCount) => {
          const fullBill = new FullBill(bill, order.orderLines, prestations, analyseCount);
          this.openModal(fullBill, line, orderLines, interventionList, order);
        });
      } else {
        const fullBill = new FullBill(bill, order.orderLines, prestations, null);
        this.openModal(fullBill, line, orderLines, interventionList, order);
      }
    });
  }

  openModal(fullBill: FullBill, line: NewBill, orderLines: LineDraft[], interventions, order: Order) {
    const data: BillData = {
      fullBill: fullBill,
      order: order,
      address: line.address,
      // We take the first intervention because there is only one for now
      interventions: interventions,
      orderLines: orderLines
    };
    const dialogRef = this.dialog.open(BillModalComponent, {
      width: 'auto',
      height: '90%',
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.billOrder(result);
        this.dataGrid.loadPage();
      }
      // else {
      //   this.cancelModal();
      // }
    });
  }

  // cancelModal() {
  //   this.clickedPosition = null;
  // this.fullBill = null;
  // this.account = null;
  // this.orderLines = null;
  // }

  //
  // billOrder(fullBill: FullBill) {
  //   const line = this.dataSourceTable.data.filter(l => l.position === this.clickedPosition)[0];
  //   if (line.billDetails.bill.status === 'pending') {
  //     for (const billLine of fullBill.lines) {
  //       for (const p of billLine.prestations) {
  //         for (const intervention of line.interventions) {
  //           intervention.asIncomplete().prestations.filter(l => l.uuid === p.uuid)[0].billLines.push(billLine.line.uuid);
  //         }
  //       }
  //     }
  //     line.billDetails.bill = fullBill.bill;
  //     line.bill = fullBill.bill.name;
  //   }
  //   // this.fullBill = null;
  //   this.clickedPosition = null;
  //   this.setPageData(0);
  // }

  downloadPdf(data: NewBill) {
    this.service.getPdf(data.id, data.name).subscribe(res => {
      if (res) {
        const url = window.URL.createObjectURL(res);
        window.open(url, '_blank');
      }
    });
  }
}
