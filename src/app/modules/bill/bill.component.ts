import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Bill, BillComment, BillLine, BillLineAdd, BillsService, Payment} from '../../services/backend/bills.service';
import {LineDraft} from '../billlines/billlines.component';
import {Prestation, PrestationForm, PrestationsService} from '../../services/backend/prestations.service';
import {Order, OrderLine, OrdersService} from '../../services/backend/orders.service';
import {DatePipe} from '@angular/common';
import {BehaviorSubject, forkJoin, Subject} from 'rxjs';
import {LinesService} from '../../services/front/lines.service';
import {InfoService} from '../../services/front/info.service';
import {InterventionsService, MaterializedIntervention} from '../../services/backend/interventions.service';
import {AddressWithRole} from '../../services/backend/addresses.service';
import {EstablishmentAddressRole} from '../../services/backend/establishments.service';
import {PeopleAddressRole} from '../../services/backend/people.service';
import {PeopleUtils} from '../utils/people-utils';
import {SortService} from '../../services/front/sort.service';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {DataComment, sortComments} from '../events/events.component';
import {FilterService} from '../../services/front/filter.service';
import {AnalyseType, AnalyseTypeService} from '../../services/backend/analyse-type.service';
import {take} from 'rxjs/internal/operators';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss']
})
export class BillComponent implements OnInit {

  @Input() data: BillData;
  @Input() asModal: boolean;
  @Input() disabled: boolean;

  @Output() updatedBill = new EventEmitter();
  @Output() saving = new EventEmitter();
  @Output() quitModal = new EventEmitter();

  currentIndex: number = 0;
  allBillPages: BillPage[];

  billLines: LineDraft[];
  loading = false;
  deadlineString: string;

  disableButton: boolean = true;
  exported: boolean;
  alwaysDisable: Subject<boolean>;
  disableBillLines: Subject<boolean>;
  accountName: string;
  accountAddress1: string;
  accountPostCode: string;
  accountSiret: string;
  accountAddress2: string;
  accountCity: string;

  userRights: ManagementRights = new ManagementRights();
  dataComments: DataComment[] = [];
  ascending = false;

  totalHT: number;
  totalTVA: number;
  totalBill: number;

  payment: Payment;
  paymentTypeName: string;
  paymentDate: Subject<Date>;
  paid: number;
  total: number;

  analyseTypeList: AnalyseType[] = [];

  constructor(
    private infoService: InfoService,
    private billsService: BillsService,
    private linesService: LinesService,
    private sortService: SortService,
    private ordersService: OrdersService,
    private interventionsService: InterventionsService,
    private datepipe: DatePipe,
    private prestationService: PrestationsService,
    private analyseTypeService: AnalyseTypeService) {
  }

  ngOnInit() {
    this.loading = true;
    this.exported = false;
    if (this.data.fullBill) {
      this.alwaysDisable = new BehaviorSubject(true);
      let bool = false;
      if (this.data.fullBill.bill.lignes.length > 0) {
        bool = true;
      }
      this.disableBillLines = new BehaviorSubject(bool || this.disabled);
      if (this.data.fullBill.bill.exportDate) {
        this.exported = true;
      }
      this.billLines = [];
      this.deadlineString = '';
      const deadline: Date = new Date();
      deadline.setDate(deadline.getDate() + 30); // TODO : this.order.establishment.payer.maxPaymentTime
      if (deadline) {
        this.data.fullBill.bill.deadline = deadline.getTime();
        this.deadlineString = this.datepipe.transform(this.data.fullBill.bill.deadline, 'dd/MM/yyyy');
      }
      for (const line of this.data.fullBill.lines) {
        let refAdx = line.line.refadx;
        if (!refAdx) {
          refAdx = this.linesService.getRefAdx(line.prestations.map(p => p.technicalAct), false);
        }
        // une analyse ne peut pas être dans un pack
        const isAnalyse = refAdx === 'Analyse';
        const lineDraft = new LineDraft(line.line.uuid, line.prestations, refAdx, isAnalyse);
        lineDraft.quantity = line.line.quantity;
        lineDraft.refBpu = line.line.refbpu;
        lineDraft.designation = line.line.designation;
        lineDraft.unitPrice = line.line.price;
        lineDraft.discount = line.line.discount;
        lineDraft.tvacode = line.line.tvacode;
        lineDraft.checkNumber();
        this.billLines.push(lineDraft);
      }
      this.allBillPages = this.data.interventions.map((int: MaterializedIntervention) => {
        const orderLines: string[] = int.asCreated().prestations.map(p => p.orderLine);
        const prestations: string[] = int.asCreated().prestations.map(p => p.uuid);
        const billLines: LineDraft[] = this.billLines.filter(billLine => {
          return billLine.prestations.filter(p => prestations.indexOf(p.uuid) > -1).length > 0;
        });
        return {
          intervention: int,
          orderLines: new BehaviorSubject(this.data.orderLines.filter(orderLine => orderLines.indexOf(orderLine.uuid) > -1)),
          billLines: new BehaviorSubject(billLines),
          valid: billLines.filter(b => !b.total).length === 0
        };
      });
      this.payment = {uuid: null, type: null, value: null, received: false, date: null};
      this.paymentDate = new BehaviorSubject<Date>(null);
      if (this.data.order.status === 'honored') {
        this.total = this.data.fullBill && this.data.fullBill.bill.lignes && this.data.fullBill.bill.lignes.length ? this.data.fullBill.bill.lignes.map(b => b.total).reduce((a, b) => a + b) : 0;
        this.paid = this.data.fullBill && this.data.fullBill.bill.paiements && this.data.fullBill.bill.paiements.length ? this.data.fullBill.bill.paiements.map(p => p.value).reduce((a, b) => a + b) : 0;
      }
    }
    let awr: AddressWithRole;
    if (this.data.order.establishment) {
      awr = this.data.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.BILLING);
      awr = awr ? awr : this.data.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.MAIN);
      this.accountName = this.data.order.establishment.establishment.name;
      this.accountSiret = this.data.order.establishment.establishment.siret;
    } else {
      // Individual
      awr = this.data.order.purchaserContact.addresses.find(a => a.role === PeopleAddressRole.BILLING);
      awr = awr ? awr : this.data.order.purchaserContact.addresses.find(a => a.role === PeopleAddressRole.MAIN);
      this.accountName = PeopleUtils.getName(this.data.order.purchaserContact);
      this.accountSiret = undefined;
    }
    this.accountAddress1 = awr.address.address1 ? awr.address.address1
      : (awr.address.gpsCoordinates ? awr.address.gpsCoordinates : awr.address.inseeCoordinates);
    this.accountAddress2 = awr.address.address2 ? awr.address.address2 : '';
    this.accountPostCode = awr.address.postCode ? awr.address.postCode : '';
    this.accountCity = awr.address.city ? awr.address.city : '';
    forkJoin(this.billsService.getAllComments(this.data.fullBill.bill.uuid).pipe(take(1)), this.analyseTypeService.getAll().pipe(take(1)))
      .subscribe(([comments, analyseTypes]: [Array<BillComment>, AnalyseType[]]) => {
        this.analyseTypeList = analyseTypes;
        this.dataComments = [];
        comments.forEach(comment => {
          this.dataComments.push({comment: comment.comment, user: comment.user, created: new Date(comment.created), eventType: 'STATUS'});
        });
        this.dataComments = sortComments(this.ascending, this.dataComments);
        this.loading = false;
      });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  billTooltip() {
    const value = this.valueFacturationAnalysis();
    return 'Conditions de facturation : ' + value;
  }

  valueFacturationAnalysis() {
    let result = this.data.order.market.facturationAnalysis;
    for (const establishment of this.data.order.market.marketEstablishments) {
      if (establishment.role === 'Client' && establishment.establishment.facturationAnalysis !== null) {
        result = establishment.establishment.facturationAnalysis;
      }
    }
    return result;
  }

  saveComment(comment: DataComment) {
    const newComment: BillComment = {
      idBill: this.data.fullBill.bill.uuid,
      user: comment.user,
      comment: comment.comment
    };
    this.billsService.addComment(newComment).subscribe(resComment => {
      this.dataComments.push({comment: comment.comment, user: resComment.user, created: new Date(comment.created), eventType: 'MESSAGE'});
      this.dataComments = sortComments(this.ascending, this.dataComments);
    });
  }

  setValue(lineDrafts: LineDraft[]) {
    const billLines: LineDraft[] = [];
    this.billLines.forEach((billLine: LineDraft) => {
      const billLinePrestations: string[] = billLine.prestations.map(p => p.uuid);
      const filteredBillLines: LineDraft[] = lineDrafts.filter(l => FilterService.hasElementsInCommon(l.prestations.map(p => p.uuid), billLinePrestations));
      const matchingBillLine: LineDraft | undefined = filteredBillLines.filter(bl => bl.hasAnalyse === billLine.hasAnalyse).pop();
      if (!!matchingBillLine) {
        billLines.push(matchingBillLine);
      } else {
        billLines.push(billLine);
      }
    });
    this.billLines = billLines;
  }

  bill() {
    this.disableBillLines.next(true);
    let foundError = false;
    for (const commandLine of this.billLines) {
      if (!commandLine.isValid()) {
        foundError = true;
      }
    }
    if (foundError) {
      this.infoService.displayError('Lignes de commande incomplètes.');
    } else if (!this.data.fullBill.bill.deadline) {
      this.infoService.displayError('La date limite est obligatoire.');
    } else {
      this.saving.emit(true);

      const prestaWithAnalyseTotUpdate: { uuid: string, prestation: PrestationForm }[] = this.billLines.filter(bl => bl.hasAnalyse).map(bl => bl.prestations).flat()
        .filter(p => !!p.analyse).map(p => ({
          uuid: p.uuid, prestation: {
            status: p.status,
            order: p.order,
            mission: p.mission,
            technicalActId: p.technicalAct.uuid,
            comment: p.comment,
            workDescription: p.workDescription,
            resultId: p.resultId,
            analyse: {
              orderLine: p.analyse.orderLineId,
              typeId: p.analyse.type.uuid
            },
            estate: p.estate,
            targetId: p.targetId,
            estateType: p.estateType,
            orderLine: p.orderLine
          }
        }));

      const lignes: BillLineAdd[] = this.billLines.map(b => {
        return {
          uuid: null,
          refadx: b.refadx,
          refbpu: b.refBpu,
          designation: b.designation,
          tvacode: b.tvacode,
          price: b.unitPrice,
          quantity: b.quantity,
          discount: b.discount,
          total: b.total,
          billingDate: null,
          creditnote: false,
          prestations: b.prestations.map(p => p.uuid)
        };
      });

      if (prestaWithAnalyseTotUpdate.length === 0) {
        this.billsService.validate(this.data.fullBill.bill.uuid, lignes, this.data.fullBill.bill.deadline).subscribe((bill) => {
          if (bill === null) {
            console.error('could not validate bill with uuid: ', this.data.fullBill.bill.uuid, ' lignes: ', lignes, ' deadline: ', this.data.fullBill.bill.deadline);
            this.saving.emit(false);
          } else {
            this.data.fullBill.bill.lignes = bill.lignes;
            this.updatedBill.emit(this.data.fullBill);
            this.saving.emit(false);
          }
        });
      } else {
        // TODO create service to update in batch all prestations
        forkJoin(prestaWithAnalyseTotUpdate.map(p => this.prestationService.update(p.uuid, p.prestation).pipe(take(1)))).subscribe(res => {
          if (res.every(b => b)) {
            this.billsService.validate(this.data.fullBill.bill.uuid, lignes, this.data.fullBill.bill.deadline).subscribe((bill) => {
              if (bill === null) {
                console.error('could not validate bill with uuid: ', this.data.fullBill.bill.uuid, ' lignes: ', lignes, ' deadline: ', this.data.fullBill.bill.deadline);
                this.saving.emit(false);
              } else {
                this.data.fullBill.bill.lignes = bill.lignes;
                this.updatedBill.emit(this.data.fullBill);
                this.saving.emit(false);
              }
            });
          } else {
            console.error('could not update prestations: ', prestaWithAnalyseTotUpdate, ' results: ', res);
            this.saving.emit(false);
          }

        });
      }
    }
  }

  checkDisable(isValid: boolean) {
    this.allBillPages[this.currentIndex].valid = isValid;
    let allValid = this.allBillPages.filter(billPage => !billPage.valid).length === 0;
    if (allValid) {
      let tempHt = 0;
      let temp = 0;
      let oneNull = false;
      for (const commandLine of this.billLines) {
        if (!oneNull) {
          if (commandLine.priceWithoutTaxes !== null && commandLine.total !== null) {
            tempHt = tempHt + commandLine.priceWithoutTaxes;
            temp = temp + commandLine.total;
          } else {
            this.totalHT = null;
            this.totalBill = null;
            this.totalTVA = null;
            oneNull = true;
            allValid = false;
          }
        }
      }
      if (!oneNull) {
        this.totalHT = Math.round(tempHt * 10000) / 10000;
        this.totalBill = Math.round(temp * 10000) / 10000;
        const tvaTemp = this.totalBill - this.totalHT;
        this.totalTVA = Math.round(tvaTemp * 10000) / 10000;
      }
    } else {
      this.totalHT = null;
      this.totalBill = null;
      this.totalTVA = null;
    }
    this.disableButton = !allValid;
  }

  unmerge() {
    this.interventionsService.mergeBills(this.data.order.uuid, this.data.interventions.map(i => i.id), [this.data.fullBill.bill.uuid], true).subscribe((done) => {
      this.quitModal.emit(true);
    });
  }

  /*  TODO : to re-add when adding payment for individuals
  savePayment() {
    this.billsService.addPayment(this.payment, this.data.fullBill.bill.uuid).subscribe((uuid) => {
      if (uuid) {
        this.data.fullBill.bill.paiements.push({
          uuid: uuid,
          type: this.payment.type,
          value: this.payment.value,
          received: this.payment.received,
          date: this.payment.date
        });
        this.paymentTypeName = '';
        this.paymentDate.next(null);
        const temp = this.paid + this.payment.value;
        this.paid = Math.round(temp * 10000) / 10000;
        if (this.paid >= this.total) {
          // TODO: il faudra vérifier que toutes les factures sont réellement payées
          this.ordersService.setStatus(this.data.order.uuid, OrderStatusLabel.CLOSED).subscribe((result) => {
            if (!result) {
              console.log('An error occurred while setting status to closed for order ' + this.data.order.uuid);
            } else {
              this.data.order.status = OrderStatusLabel.CLOSED;
            }
          });
        }
        this.payment = {uuid: null, type: null, value: null, received: false, date: null};
      }
    });
  }
  */

  exit() {
    this.quitModal.emit(false);
  }

}

export class FullBill {
  bill: Bill;
  lines: FullBillLine[];

  constructor(bill: Bill, orderLines: OrderLine[], prestations: Prestation[], analyseCountFromPrestations: number) {
    const finalPrestations = prestations.filter(p => p.resultId);
    this.bill = bill;
    this.lines = [];
    if (bill.lignes.length > 0) {
      for (const line of bill.lignes) {
        const linePrestations: Prestation[] = [];
        for (const prestation of finalPrestations) {
          if (prestation.billLines.indexOf(line.uuid) > -1) {
            linePrestations.push(prestation);
          }
        }
        this.lines.push(new FullBillLine(line, linePrestations));
      }
    } else {
      for (const orderLine of orderLines) {
        const billLine: BillLine = {
          uuid: null,
          refadx: orderLine.refadx,
          refbpu: orderLine.refbpu,
          designation: orderLine.designation,
          price: orderLine.price,
          quantity: orderLine.refadx === 'Analyse' && !isNaN(analyseCountFromPrestations) ? analyseCountFromPrestations : orderLine.quantity,
          tvacode: orderLine.tvacode,
          discount: orderLine.discount,
          total: orderLine.total,
          billingDate: null
        };
        const linePrestations: Prestation[] = [];
        for (const prestation of finalPrestations) {
          if (prestation.orderLine === orderLine.uuid || (prestation.analyse && prestation.analyse.orderLineId) && (prestation.analyse.orderLineId === orderLine.uuid)) {
            linePrestations.push(prestation);
          }
        }
        if (linePrestations.length > 0) {
          this.lines.push(new FullBillLine(billLine, linePrestations));
        }
      }
      for (const prestation of finalPrestations.filter(p => !p.orderLine)) {
        const billLine: BillLine = {
          uuid: null,
          refadx: null,
          refbpu: null,
          designation: null,
          price: null,
          quantity: 1,
          tvacode: '20%',
          discount: 0,
          total: null,
          billingDate: null
        };
        this.lines.push(new FullBillLine(billLine, [prestation]));
      }
      if (!isNaN(analyseCountFromPrestations) && analyseCountFromPrestations > 0 && prestations.filter(p => p.analyse).length === 0) {
        const analyses: Prestation[] = prestations.filter(p => p.technicalAct.hasAnalyse && (!p.analyse || !p.analyse.orderLineId));
        const billLine: BillLine = {
          uuid: null,
          refadx: 'Analyse',
          refbpu: null,
          designation: null,
          price: null,
          quantity: analyseCountFromPrestations,
          tvacode: '20%',
          discount: 0,
          total: null,
          billingDate: null
        };
        this.lines.push(new FullBillLine(billLine, analyses));
      }
    }
  }
}

export interface BillData {
  fullBill: FullBill;
  order: Order;
  interventions: MaterializedIntervention[];
  address: string;
  orderLines: LineDraft[];
}

export class FullBillLine {
  line: BillLine;
  prestations: Prestation[];

  constructor(billLine: BillLine, prestations: Prestation[]) {
    this.line = billLine;
    this.prestations = prestations;
  }

}

export class BillPage {
  intervention: MaterializedIntervention;
  orderLines: Subject<LineDraft[]>;
  billLines: Subject<LineDraft[]>;
  valid: boolean;
}

export enum BillStatus {
  PENDING,
  CONFIRMED,
  BILLED,
  CANCELLED
}
