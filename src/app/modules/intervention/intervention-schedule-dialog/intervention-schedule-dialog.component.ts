import {Component, Input, OnInit, Output} from '@angular/core';
import {InterventionPlanning, InterventionsService, MaterializedIntervention} from '../../../services/backend/interventions.service';
import {InterventionStatus, InterventionUtils} from '../../utils/intervention-utils';
import {InfoService} from '../../../services/front/info.service';
import {debounceTime, first, take} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {Expert, ExpertsService} from '../../../services/backend/experts.service';
import {NgxMaterialTimepickerTheme} from 'ngx-material-timepicker';
import {OrderStatusLabel} from '../../utils/order-utils';
import {Order, OrdersService} from '../../../services/backend/orders.service';

@Component({
  selector: 'app-intervention-schedule',
  templateUrl: './intervention-schedule-dialog.component.html',
  styleUrls: ['./intervention-schedule-dialog.component.scss']
})
export class InterventionScheduleDialogComponent implements OnInit {
  @Input() materializedIntervention: MaterializedIntervention;
  @Input() order: Order;

  saveResult: Subject<boolean> = new Subject();
  isSaving: Subject<boolean> = new Subject();
  @Output() saveResultObs: Observable<boolean> = this.saveResult.asObservable();
  @Output() isSavingObs: Observable<boolean> = this.isSaving.asObservable();

  loading: boolean;
  saving: boolean;

  scheduleInfo: InterventionPlanning;
  startDateValue: number;
  timePickerValue: string;

  inputStatus: InterventionStatus;
  outputStatus: InterventionStatus;

  getStatusName = InterventionUtils.getStatusName;

  suggestedExperts: Expert[];
  fromExistingExpert: boolean;
  lastNameChanged: Subject<void> = new Subject<void>();

  css: { primaryColor: string } = {
    primaryColor: '#22a8c2'
  };

  constructor(protected interventionsService: InterventionsService,
              protected expertsService: ExpertsService,
              protected ordersService: OrdersService,
              protected infoService: InfoService) {
  }

  ngOnInit(): void {
    this.saving = false;
    this.isSaving.next(false);
    this.fromExistingExpert = false;
    if (!this.materializedIntervention || !this.materializedIntervention.isSettled || !this.order || !this.order.uuid) {
      this.infoService.displayError('Cette intervention ne peut pas être planifiée manuellement !');
    } else {
      this.inputStatus = InterventionStatus.SETTLED;
      this.outputStatus = InterventionStatus.SCHEDULED;
      this.scheduleInfo = {
        startingTime: null,
        expert: {
          id: null,
          firstName: null,
          lastName: null,
          mail: null,
          skills: []
        },
        duration: 60
      };

      this.lastNameChanged.pipe(debounceTime(500))
        .subscribe(() => {
          this.fromExistingExpert = false;
          this.scheduleInfo.expert.id = null;
          this.suggest(this.scheduleInfo.expert.lastName);
        });

      this.loading = false;
    }
  }

  save(): void {
    this.saving = true;
    this.isSaving.next(true);
    const hours = +this.timePickerValue.split(':')[0];
    const minutes = +this.timePickerValue.split(':')[1];
    const dateTime: Date = new Date(this.startDateValue);
    dateTime.setHours(hours, minutes);
    this.scheduleInfo.startingTime = dateTime.getTime();
    this.interventionsService.manualScheduleIntervention(this.materializedIntervention.id, this.scheduleInfo).pipe(first())
      .subscribe(isScheduleSuccess => {
        this.isSaving.next(false);
        if (isScheduleSuccess) {
          this.ordersService.setStatus(this.order.uuid, OrderStatusLabel.PRODUCTION).pipe(first()).subscribe(res => {
            if (res) {
              this.infoService.displaySaveSuccess();
              this.saveResult.next(true);
            } else {
              this.infoService.displayError('Echec de la mise à jour du statut de la commande.');
              this.saveResult.next(false);
            }
          });
        } else {
          this.infoService.displayError('Echec de la planification de l\'intervention.');
          this.saveResult.next(false);
        }
      });
  }

  canSave(): boolean {
    return !this.loading && !!this.scheduleInfo.duration && !!this.startDateValue && !!this.timePickerValue
      && (!!this.scheduleInfo.expert.id || (!!this.scheduleInfo.expert.firstName && !!this.scheduleInfo.expert.lastName && !!this.scheduleInfo.expert.mail));
  }

  changeInterventionStartDate(event: number): void {
    this.startDateValue = event;
  }

  suggest(input: string): void {
    if (!!input && input.length > 3) {
      this.expertsService.suggestAll(input).pipe(take(1)).subscribe(experts => {
        this.suggestedExperts = experts;
      });
    } else {
      this.suggestedExperts = [];
    }
  }

  selectExpert(expert: Expert): void {
    this.scheduleInfo.expert.id = expert.id;
    this.scheduleInfo.expert.firstName = expert.firstName;
    this.scheduleInfo.expert.lastName = expert.lastName;
    this.scheduleInfo.expert.mail = expert.mail;
    this.fromExistingExpert = true;
  }


  lastNameChange(): void {
    this.lastNameChanged.next();
  }

  isNew(): boolean {
    return !this.fromExistingExpert;
  }

  adxTheme: NgxMaterialTimepickerTheme = {
    dial: {
      dialBackgroundColor: this.css.primaryColor,
    },
    clockFace: {
      clockHandColor: this.css.primaryColor
    }
  };
}
