import {Injectable} from '@angular/core';
import {forkJoin, Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {Bill, BillDetails, BillsService} from '../backend/bills.service';
import {Prestation} from '../backend/prestations.service';
import {InterventionsService, MaterializedIntervention} from '../backend/interventions.service';
import {OrdersService} from '../backend/orders.service';
import {EstatesService} from '../backend/estates.service';
import {AddressesService} from '../backend/addresses.service';
import {OrderStatusLabel} from '../../modules/utils/order-utils';
import {BillStatus} from '../../modules/bill/bill.component';
import {ManagementRights} from "../../core/rights/ManagementRights";
import {AllBillTableLine} from '../../modules/order/order-bill/order-bill.component';
import {NewBill} from '../../modules/bills/new-bill';

@Injectable()
export class FrontBillsService {

  userRights: ManagementRights = new ManagementRights();

  constructor(private ordersService: OrdersService,
              private estatesService: EstatesService,
              private addressesService: AddressesService,
              private billsService: BillsService,
              private interventionsService: InterventionsService) {
  }

  buildBillTableLines(allBills: BillDetails[], actionDisabled: boolean, keepActiveOpenDialog?: boolean): AllBillTableLine[] {
    let i = 1;
    return allBills.map((bill) => {
      let creditNoteName = '';
      let exportDate = null;
      if (bill.bill.creditnotes.length > 0) {
        // on ne peut avoir qu'un avoir par facture
        creditNoteName = bill.bill.creditnotes[0].name;
        if (bill.bill.creditnotes[0].exportdate) {
          exportDate = bill.bill.creditnotes[0].exportdate;
        } else {
          exportDate = bill.bill.exportDate;
        }
      } else if (bill.bill.paiements.length > 0 && bill.bill.paiements.filter(p => p.exportDate).length > 0) {
        const max = bill.bill.paiements.map(p => p.exportDate).reduce((a, b) => {
          return Math.max(a, b);
        });
        exportDate = max;
      } else if (bill.bill.exportDate) {
        exportDate = bill.bill.exportDate;
      }
      const data: AllBillTableLine = {
        position: i,
        id: bill.bill.uuid,
        bill: bill.bill.name,
        creditnote: creditNoteName,
        referenceNumber: bill.order.referenceNumber,
        commandName: bill.order.name,
        accountName: bill.account.entity ? bill.account.entity.name : bill.account.contact.lastname.toUpperCase() + ' ' + bill.account.contact.firstname,
        marketName: bill.order.market ? bill.order.market.name + ' - ' + bill.order.market.marketNumber : '',
        address: bill.address,
        status: this.getStatus(bill.bill.status),
        exportDate: exportDate,
        billDetails: bill,
        interventions: bill.interventions.map(int => this.interventionsService.buildIntervention(int)),
        actionDisabled: actionDisabled,
        keepActiveOpenDialog: keepActiveOpenDialog
      };
      i++;
      return data;
    });
  }

  generateAvoir(line: AllBillTableLine | NewBill, interventions: any[] = []): Observable<boolean> {
    let billId;
    let orderId;
    let interventionList;
    if (interventions.length) {
      billId = (line as NewBill).id;
      orderId = (line as NewBill).order.id;
      interventionList = interventions.map(i => i.id);
    } else {
      billId = (line as AllBillTableLine).billDetails.bill.uuid;
      orderId = (line as AllBillTableLine).billDetails.order.uuid;
      interventionList = (line as AllBillTableLine).billDetails.interventions.map(i => i.id);
    }


    return this.billsService.addCreditNote(
      billId,
      interventionList
    ).pipe(mergeMap((uuid) => {
      if (uuid) {
        return this.ordersService.setStatus(orderId, OrderStatusLabel.BILLABLE).pipe(map((result) => {
          if (result === true) {
            return true;
            // this.setPageData(0);
            // this.workInProgress = false;
          } else {
            return false;
            // this.workInProgress = false;
          }
        }));
      } else {
        return of(false);
      }
    }));
  }

  getStatus(billStatus: string): number {
    switch (billStatus) {
      case 'pending':
        return BillStatus.PENDING;
      case 'confirmed':
        return BillStatus.CONFIRMED;
      case 'billed':
        return BillStatus.BILLED;
      case 'cancelled':
        return BillStatus.CANCELLED;
      default:
        return -1;
    }
  }
}
