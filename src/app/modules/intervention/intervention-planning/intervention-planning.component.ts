import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {InterventionsService, MaterializedIntervention} from '../../../services/backend/interventions.service';
import {Expert} from '../../../services/backend/experts.service';
import {Order, OrdersService} from '../../../services/backend/orders.service';
import {DatePipe} from '@angular/common';
import {OrderStatusLabel} from '../../utils/order-utils';

@Component({
  selector: 'app-intervention-planning',
  templateUrl: './intervention-planning.component.html',
  styleUrls: ['./intervention-planning.component.scss']
})
export class InterventionPlanningComponent implements OnInit {

  @Input() intervention: MaterializedIntervention;
  @Input() order: Order;
  @Input() disabled: boolean;

  @Output() interventionChanges: EventEmitter<MaterializedIntervention> = new EventEmitter();

  constructor(protected interventionsService: InterventionsService, protected ordersService: OrdersService, private datepipe: DatePipe) {
  }

  ngOnInit(): void {
    if (this.intervention.isSchedule || this.intervention.isIncomplete || this.intervention.isDone) {
      this.expert = this.intervention.asSchedule().planning.expert;
    }
  }

  public expert: Expert;

  public isScheduleLoading = false;

  public scheduleIntervention() {
    this.isScheduleLoading = true;

    if (this.intervention.isSettled) {
      this.interventionsService.schedule(this.intervention.id).subscribe(intervention => {
        this.ordersService.setStatus(this.order.uuid, OrderStatusLabel.PRODUCTION).subscribe((result) => {
          if (result) {
            this.order.status = OrderStatusLabel.PRODUCTION;
            this.intervention = intervention;
            this.isScheduleLoading = false;
            this.interventionChanges.emit(intervention);
          }
        });
      });
    } else {
      console.log('Can\'t schedule intervention ' + this.intervention.id + '. Wrong state');
      this.isScheduleLoading = false;
    }
  }

  secondsToHumanReadable(seconds: number) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }

  getDateFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return;
    }
    return this.datepipe.transform(date, 'dd/MM/yyyy');
  }

  getTimeFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return;
    }
    return this.datepipe.transform(date, 'HH:mm');
  }
}
