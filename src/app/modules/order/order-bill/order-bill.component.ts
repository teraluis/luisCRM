import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog, MatTableDataSource} from '@angular/material';
import {Bill, BillDetails, BillsService} from '../../../services/backend/bills.service';
import {BillData, BillStatus, FullBill} from '../../bill/bill.component';
import {Prestation, PrestationsService} from '../../../services/backend/prestations.service';
import {Order, OrdersService} from '../../../services/backend/orders.service';
import {LineDraft} from '../../billlines/billlines.component';
import {LinesService} from '../../../services/front/lines.service';
import {SortService} from '../../../services/front/sort.service';
import {BillModalComponent} from '../../bill-modal/bill-modal.component';
import {NavigationService} from '../../../services/front/navigation.service';
import {InfoService} from '../../../services/front/info.service';
import {InterventionsService, MaterializedIntervention} from '../../../services/backend/interventions.service';
import {EstatesService} from '../../../services/backend/estates.service';
import {Router} from '@angular/router';
import {
  ActionEvent,
  ActionType,
  ColumnInformation,
  FilterType, TableLine,
  TableOption,
  TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {AddressesService} from '../../../services/backend/addresses.service';
import {TechnicalActService} from '../../../services/backend/technical-act.service';
import {OrderStatusLabel} from '../../utils/order-utils';
import {FrontBillsService} from '../../../services/front/bills.service';
import {SelectionModel} from '@angular/cdk/collections';
import {NewBill} from '../../bills/new-bill';
import {ConfirmationComponent} from "../../confirmation/confirmation.component";

@Component({
  selector: 'app-order-bill',
  templateUrl: './order-bill.component.html'
})
export class OrderBillComponent implements OnInit, TableSearchListInterface {

  @Input() order: Order;
  @Input() disabled: boolean;

  @Output() update = new EventEmitter<void>();

  dataSource = new MatTableDataSource<AllBillTableLine>([]);
  workInProgress = false;
  clickedPosition: number;
  action = false;
  interventions: MaterializedIntervention[];
  bills: Bill[];
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.SELECT, TableOption.OPEN_DIALOG, TableOption.ACTION_BILL];
  displayedColumns: string[] = ['bill', 'creditnote', 'referenceNumber', 'address', 'status', 'exportDate'];
  hiddenColumns: string[] = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Facture', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Avoir', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Bon de commande', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Adresse du bien', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Statut', filterType: FilterType.STATUS, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Date d\'export', filterType: FilterType.DATE, filterDisabled: true}
  ];
  maxRows = 20;
  dataSourceChange = new EventEmitter<any>();
  selectedBills: SelectionModel<AllBillTableLine>;
  isEmpty = false;
  disableMerge = true;

  constructor(private infoService: InfoService,
              private navigationService: NavigationService,
              protected router: Router,
              protected billsService: BillsService,
              private ordersService: OrdersService,
              private prestationsService: PrestationsService,
              private interventionsService: InterventionsService,
              private estatesService: EstatesService,
              private linesService: LinesService,
              private sortService: SortService,
              private addressesService: AddressesService,
              protected dialog: MatDialog,
              private technicalActService: TechnicalActService,
              private frontBillsService: FrontBillsService) {
  }

  ngOnInit() {
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.billsService.getFromOrder(this.order.uuid).subscribe((bills) => {
      const data = bills && bills.length ? this.frontBillsService.buildBillTableLines(bills, this.disabled) : [];
      const dataSource = new MatTableDataSource<AllBillTableLine>(data);
      this.dataSource.data = dataSource.data;
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  clickEvent(event: ActionEvent) {
    switch (event.action) {
      case ActionType.REMOVE:
        this.removeBill(event.event);
        break;
      case ActionType.CREDIT_NOTE:
        this.frontBillsService.generateAvoir(event.event).subscribe((res) => {
          if (res) {
            this.setFilterData('');
            this.update.emit();
          }
        });
        break;
      case ActionType.OPEN_DIALOG:
        this.setModal(event.event);
        break;

      case ActionType.PDF:
        this.downloadPdf(event.event);
        break;
      default:
        break;
    }
  }

  removeBill(line: AllBillTableLine) {
    this.workInProgress = true;
    this.billsService.delete(line.billDetails.bill.uuid).subscribe((res) => {
      if (!res) {
        this.workInProgress = false;
      } else {
        this.ordersService.setStatus(line.billDetails.order.uuid, OrderStatusLabel.BILLABLE).subscribe((done) => {
          if (done === false) {
            this.workInProgress = false;
          } else {
            line.billDetails.bill = null;
            line.bill = '';
            this.workInProgress = false;
          }
        });
      }
    });
  }

  setModal(line: AllBillTableLine) {
    this.clickedPosition = line.position;
    const order = line.billDetails.order;
    const orderLines = [];
    const prestations: Prestation[] = [];
    line.interventions.forEach(intervention => {
      intervention.asIncomplete().prestations.forEach(prestation => {
        prestations.push(prestation);
      });
    });
    const lineIds = prestations.map(p => p.orderLine);
    prestations.filter(p => p.analyse && p.analyse.orderLineId).forEach(p => lineIds.push(p.analyse.orderLineId));
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
    if (line.billDetails.bill.status === 'pending') {
      this.linesService.getTotalAnalyseCount(prestations).subscribe((analyseCount) => {
        const fullBill = new FullBill(line.billDetails.bill, line.billDetails.order.orderLines, prestations, analyseCount);
        this.openModal(fullBill, line, orderLines);
      });
    } else {
      const fullBill = new FullBill(line.billDetails.bill, null, prestations, null);
      this.openModal(fullBill, line, orderLines);
    }
  }

  openModal(fullBill: FullBill, line: AllBillTableLine, orderLines: LineDraft[]) {
    const data: BillData = {
      fullBill: fullBill,
      order: line.billDetails.order,
      address: line.billDetails.address,
      interventions: line.interventions,
      orderLines: orderLines
    };
    const dialogRef = this.dialog.open(BillModalComponent, {
      width: 'auto',
      height: '90%',
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.setFilterData('');
        } else if (result === false) {
          this.cancelModal();
        } else if (result) {
          this.billOrder(result);
        }
      }
    );
  }

  cancelModal() {
    this.clickedPosition = null;
    // this.fullBill = null;
    // this.orderLines = null;
  }

  billOrder(fullBill: FullBill) {
    const line = this.dataSource.data.filter(l => l.position === this.clickedPosition)[0];
    if (line.billDetails.bill.status === 'pending') {
      for (const billLine of fullBill.lines) {
        for (const p of billLine.prestations) {
          for (const intervention of line.interventions) {
            intervention.asIncomplete().prestations.filter(l => l.uuid === p.uuid)[0].billLines.push(billLine.line.uuid);
          }
        }
      }
      line.billDetails.bill = fullBill.bill;
      line.bill = fullBill.bill.name;
    }
    // this.fullBill = null;
    this.clickedPosition = null;
    this.setFilterData('');
    this.update.emit();
  }

  select(event: SelectionModel<AllBillTableLine>) {
    this.selectedBills = event;
    this.disableMerge = !this.selectedBills || !this.selectedBills.selected
      || this.selectedBills.selected.length < 2 || this.selectedBills.selected.filter(s => s.status !== BillStatus.PENDING).length > 0;
  }

  mergeBills(lines: AllBillTableLine[]) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '40%',
      data: {title: 'Attention', text: 'Êtes-vous sûr de vouloir regrouper ces factures en une seule?'}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const interventions: string[] = [].concat(...lines.map(l => l.interventions.map(i => i.id)));
        const bills: string[] = lines.map(l => l.billDetails.bill.uuid);
        const order: string = lines[0].billDetails.order.uuid;
        this.interventionsService.mergeBills(order, interventions, bills, false).subscribe((done) => {
          if (done) {
            this.setFilterData('');
            this.update.emit();
          }
        });
      }
    });
  }

  getStatusName = (key: number) => {
    switch (key) {
      case BillStatus.PENDING:
        return 'À vérifier';
      case BillStatus.CONFIRMED:
        return 'À facturer';
      case BillStatus.BILLED:
        return 'À recouvrer';
      case BillStatus.CANCELLED:
        return 'Facture annulée';
      default:
        return 'Etat inconnu';
    }
  };

  getStatusColor = (key: number) => {
    switch (key) {
      case BillStatus.BILLED:
        return 'green';
      case BillStatus.PENDING:
        return 'warn';
      case BillStatus.CONFIRMED:
        return 'blue';
      case BillStatus.CANCELLED:
        return 'red';
      default:
        return 'grey';
    }
  };

  getStatusList = () => {
    const result = [];
    Object.values(BillStatus).forEach(e => {
      if (!isNaN(Number(e))) {
        result.push({name: e, value: this.getStatusName(e)});
      }
    });
    return result;
  };

  downloadPdf(line: AllBillTableLine) {
    this.billsService.getPdf(line.billDetails.bill.uuid, line.bill).subscribe(res => {
      const url = window.URL.createObjectURL(res);
      window.open(url, '_blank');
    });
  }
}

export interface AllBillTableLine extends TableLine {
  bill: string;
  creditnote: string;
  referenceNumber: string;
  commandName: string;
  accountName: string;
  marketName: string;
  address: string;
  status: number;
  exportDate: number;
  billDetails: BillDetails;
  interventions: MaterializedIntervention[];
}
