import {Component, OnInit} from '@angular/core';
import {OrdersCount, OrdersService} from '../../services/backend/orders.service';
import {InterventionCount, InterventionsService} from '../../services/backend/interventions.service';
import {OrderCreateDialogComponent} from '../order-create-dialog/order-create-dialog.component';
import {MatDialog} from '@angular/material';
import {BillCount, BillsService} from '../../services/backend/bills.service';
import {SingleDataSet} from 'ng2-charts';
import {PrestationsService} from '../../services/backend/prestations.service';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {InfoService} from '../../services/front/info.service';
import {Router} from '@angular/router';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  userRights: ManagementRights = new ManagementRights();
  // Factures
  billsToVerifiedCount: number;
  billsVerifiedCount: number;
  billsSent: number;
  billsCount: number;
  billReceived: number;
  billsCancelled: number;
  // Commandes
  ordersCount: number;
  orderReceivedCount: number;
  orderFilledCount: number;
  orderProductionCount: number;
  ordersBillableCount: number;
  ordersHonoredCount: number;
  ordersClosedCount: number;
  // Interventions
  interCount: number;
  interDraftCount: number;
  interCreatedCount: number;
  interSettledCount: number;
  interToScheduledCount: number;
  interScheduledCount: number;
  interIncompleteCount: number;
  interDoneCount: number;

  pieChartData: SingleDataSet = [];
  chartContent: number;
  pieChartLabels = ['Arrive à échéance', 'Dans les délais', 'Hors délais'];
  pieColors: any[] = [
    {backgroundColor: ['#ffa700', '#7DC900', '#fc4349']}
  ];
  deadlineOutdatedCount: number;
  deadlineCloseCount: number;
  deadlineOkCount: number;
  action = false;
  actionData: PlusActionData[] = [
    {
      label: 'Commande',
      icon: 'add',
      function: () => this.createOrder()
    }
  ];

  wordLong = "abcd";
  constructor(private infoService: InfoService, private navigationService: NavigationService, private router: Router, private ordersService: OrdersService, protected dialog: MatDialog, private interventionsService: InterventionsService, private billsService: BillsService, private prestationsService: PrestationsService) {
  }

  ngOnInit() {

    this.navigationService.set({menu: MenuStep.DASHBOARD, url: this.router.url});

    this.ordersService.getCount().subscribe((res: OrdersCount) => {
      if (res) {
        this.pieChartData = [res.deadlineClose, res.deadlineOk, res.deadlineOutdated];
        this.chartContent = res.deadlineClose + res.deadlineOk + res.deadlineOutdated;
        this.deadlineOkCount = res.deadlineOk;
        this.deadlineCloseCount = res.deadlineClose;
        this.deadlineOutdatedCount = res.deadlineOutdated;

        // carte commandes
        this.ordersCount = res.total;
        this.orderReceivedCount = res.received;
        this.orderFilledCount = res.filled;
        this.orderProductionCount = res.production;
        this.ordersBillableCount = res.billable;
        this.ordersHonoredCount = res.honored;
        this.ordersClosedCount = res.closed;
      }
    });

    // carte interventions
    this.interventionsService.getCount().subscribe((res: InterventionCount) => {
      if (res) {
        this.interCount = res.total;
        this.interDraftCount = res.draft;
        this.interCreatedCount = res.created;
        this.interSettledCount = res.settled;
        this.interToScheduledCount = res.to_schedule;
        this.interScheduledCount = res.scheduled;
        this.interIncompleteCount = res.incomplete;
        this.interDoneCount = res.done;
      }
    });

    this.billsService.getCount().subscribe((res: BillCount) => {
      if (res) {
        this.billsCount = res.total;
        this.billsToVerifiedCount = res.pending;
        this.billsVerifiedCount = res.confirmed;
        this.billsSent = res.billed;
        this.billReceived = res.paid;
        this.billsCancelled = res.cancelled;
      }
    });
  }

  createOrder() {
    this.dialog.open(OrderCreateDialogComponent, {
      width: '40%'
    });
  }

  findLong(s: string) {
    const tab = s.split("");
    tab.map(x => {
      console.log(x);
    });
  }
}



