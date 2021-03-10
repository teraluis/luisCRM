import {Component, Inject, OnInit} from '@angular/core';
import {
  InterventionParameters,
  InterventionPlanning,
  InterventionsService,
  InterventionUpdateInfo,
  MaterializedIntervention
} from '../../../services/backend/interventions.service';
import {InterventionStatus, InterventionUtils} from '../../utils/intervention-utils';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {InfoService} from '../../../services/front/info.service';
import {take} from 'rxjs/operators';
import {Order} from '../../../services/backend/orders.service';
import {ReportService, Urls} from '../../../services/backend/report.service';

@Component({
  selector: 'app-intervention-update',
  templateUrl: './intervention-update-dialog.component.html',
  styleUrls: ['./intervention-update-dialog.component.scss']
})
export class InterventionUpdateDialogComponent implements OnInit {
  loading: boolean;
  saving: boolean;

  updateInfo: InterventionUpdateInfo;
  materializedIntervention: MaterializedIntervention;
  interventionParameters: InterventionParameters;
  planning: InterventionPlanning;
  order: Order;

  inputStatus: InterventionStatus;
  outputStatus: InterventionStatus;

  getStatusName = InterventionUtils.getStatusName;

  urls: Urls;

  // Allow to update intervention status:
  // from SCHEDULED to INCOMPLETE
  // or
  // from INCOMPLETE to FINAL
  constructor(@Inject(MAT_DIALOG_DATA) data: { intervention: MaterializedIntervention, order: Order },
              public dialogRef: MatDialogRef<InterventionUpdateDialogComponent>,
              protected interventionsService: InterventionsService,
              protected reportService: ReportService,
              protected infoService: InfoService) {
    this.materializedIntervention = data.intervention;
    this.order = data.order;

    // assign a value to this.interventionParameters depending on status
    // else it will quit during ngOnInit if it is still null/undefined
    if (data.intervention.isSchedule) {
      this.interventionParameters = data.intervention.asSchedule().parameters;
      this.planning = data.intervention.asSchedule().planning;
      this.inputStatus = InterventionStatus.SCHEDULED;
      this.outputStatus = InterventionStatus.INCOMPLETE;

    } else if (data.intervention.isIncomplete) {
      this.interventionParameters = data.intervention.asIncomplete().parameters;
      this.planning = data.intervention.asIncomplete().planning;
      this.inputStatus = InterventionStatus.INCOMPLETE;
      this.outputStatus = InterventionStatus.DONE;
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.saving = false;
    this.updateInfo = {
      interventionDate: null,
      closureDate: null,
      expertLabel: null,
      status: this.outputStatus
    };
    if (this.planning) {
      this.updateInfo.expertLabel = this.planning.expert.firstName + ' ' + this.planning.expert.lastName;
    }

    if (!!this.interventionParameters) {
      this.updateInfo.interventionDate = this.interventionParameters.interventionDate;
      this.updateInfo.closureDate = this.interventionParameters.closureDate;
      this.updateInfo.reportId = this.interventionParameters.reportId;
      this.reportService.getUrls().pipe(take(1)).subscribe(urls => {
        if (!!urls) {
          this.urls = urls;
          this.dialogRef.updateSize('40%');
          this.loading = false;
        } else {
          this.closeWithError('Une erreur est survenue lors du chargement des paramètres.');
        }
      });
    } else {
      this.closeWithError('Cette intervention ne peut pas être mise à jour manuellement !');
    }
  }

  save() {
    this.saving = true;
    if (this.inputStatus === InterventionStatus.SCHEDULED) {
      const relativeUrl = '';
      const interventionName = this.materializedIntervention.asSchedule().name;
      this.reportService.setStorageInfo(this.urls.baseUrl, this.urls.library, relativeUrl, interventionName).pipe(take(1))
        .subscribe(res => {
          if (!!res) {
            this.updateInfo.reportId = res.reportId;
            this.doUpdateIntervention();
          } else {
            this.closeWithError('Echec de la création du rapport');
          }
        });

    } else if (this.inputStatus === InterventionStatus.INCOMPLETE) {
      this.doUpdateIntervention();
    } else {
      this.closeWithError('Cette intervention ne peut pas être mise à jour manuellement !');
    }
  }

  canSave(): boolean {
    return !this.loading && !!this.updateInfo.closureDate && !!this.updateInfo.interventionDate && !!this.updateInfo.expertLabel && !!this.updateInfo.status;
  }

  changeInterventionDate(event: number) {
    console.log('event', event);
    this.updateInfo.interventionDate = event;
  }

  changeClosureDate(event: number) {
    this.updateInfo.closureDate = event;
  }

  closeWithError(msg: string) {
    this.loading = false;
    this.infoService.displayError(msg);
    this.dialogRef.close(false);
  }

  private doUpdateIntervention() {
    this.interventionsService.updateIntervention(this.materializedIntervention.id, this.updateInfo).pipe(take(1))
      .subscribe(isUpdateSuccess => {
        if (isUpdateSuccess) {
          if (this.updateInfo.status === InterventionStatus.DONE) {
            this.doBillIntervention();
          } else {
            this.infoService.displaySaveSuccess();
            this.dialogRef.close(true);
          }
        } else {
          this.closeWithError('Echec de la mise à jour du statut l\'intervention.');
        }
      });
  }

  private doBillIntervention() {
    this.interventionsService.billIntervention({
      order: this.order.uuid,
      interventions: [this.materializedIntervention.id]
    }).pipe(take(1))
      .subscribe(isBillSuccess => {
        if (isBillSuccess) {
          this.infoService.displaySaveSuccess();
          this.dialogRef.close(true);
        } else {
          this.closeWithError('Echec de la mise à jour de la facturation lié à l\'intervention.');
        }
      });
  }
}
