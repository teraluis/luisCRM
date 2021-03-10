import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Prestation, PrestationsService} from '../../../services/backend/prestations.service';
import {
  DoneIntervention,
  IncompleteIntervention,
  InterventionsService
} from '../../../services/backend/interventions.service';
import {Asbestos, Electricity, Gas, ResultsService} from '../../../services/backend/results.service';
import {Order, ReportDestination, ReportDestinationDisplay} from '../../../services/backend/orders.service';
import {DistantStorageInfo, ReportService} from '../../../services/backend/report.service';
import {Estate} from '../../../services/backend/estates.service';
import {Address} from '../../../services/backend/addresses.service';
import {AddressUtils} from '../../utils/address-utils';
import {shortcuts, TechnicalAct} from '../../../services/backend/technical-act.service';
import {take} from 'rxjs/operators';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {
  InterventionResultsDialogComponent,
  ResultDialogInput
} from '../intervention-results-dialog/intervention-results-dialog.component';
import {Observable, Subject} from 'rxjs';
import {PlusActionData} from '../../plus-button/plus-button.component';

@Component({
  selector: 'app-intervention-reportresults',
  templateUrl: './intervention-reportresults.component.html',
  styleUrls: ['./intervention-reportresults.component.scss']
})
export class InterventionReportresultsComponent implements OnInit, OnChanges {
  @Input() intervention: IncompleteIntervention | DoneIntervention;
  @Input() estate: Estate;
  @Input() address: Address;
  @Input() order: Order;
  @Input() disabled: boolean;

  private saveResult: Subject<boolean> = new Subject();
  @Output() saveResultObs: Observable<boolean> = this.saveResult.asObservable();
  @Output() getActionButton: EventEmitter<PlusActionData[]> = new EventEmitter<PlusActionData[]>();

  loading = false;

  private actionButton: PlusActionData[] = [];
  private perfomedPrestationList: Prestation[] = [];
  private plannedPrestationList: Prestation[] = [];
  private prestationCheckList: CheckPrestationTypeResult[] = [];
  private orderedAnalyses: number;

  private raatResult: Asbestos;
  private dappResult: Asbestos;
  private elecResult: Electricity;
  private gasResult: Gas;

  private hasAnalyse: boolean;
  private analysesLaboTotal: number;
  private analyseCountTotal: number;

  private finalReportLink: string;
  private ddtReportLink: string;
  private gasReportLink: string;
  private elecReportLink: string;
  private dappReportLink: string;
  private raatReportLink: string;

  private folderLink: string;

  constructor(private prestationService: PrestationsService,
              private interventionsService: InterventionsService,
              private resultsService: ResultsService,
              private reportService: ReportService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loading = true;
    if ((this.intervention.isDone || this.intervention.isIncomplete) && this.intervention.parameters.reportId) {
      this.reportService.getStorageInfo(this.intervention.parameters.reportId).pipe(take(1)).subscribe((distantStorageInfo: DistantStorageInfo) => {
        if (distantStorageInfo) {
          const commonRoot = distantStorageInfo.baseUrl + '/' + distantStorageInfo.library + '/';
          if (!!distantStorageInfo.interventionSubName) {
            this.folderLink = commonRoot + distantStorageInfo.interventionName;
          } else {
            this.folderLink = commonRoot + distantStorageInfo.relativeUrl;
          }
          this.finalReportLink = distantStorageInfo.finalReportPdfRelUrl ? commonRoot + distantStorageInfo.finalReportPdfRelUrl : null;
          this.ddtReportLink = distantStorageInfo.ddtPdfRelUrl ? commonRoot + distantStorageInfo.ddtPdfRelUrl : null;
          this.gasReportLink = distantStorageInfo.gasPdfRelUrl ? commonRoot + distantStorageInfo.gasPdfRelUrl : null;
          this.elecReportLink = distantStorageInfo.elecPdfRelUrl ? commonRoot + distantStorageInfo.elecPdfRelUrl : null;
          this.dappReportLink = distantStorageInfo.dappPdfRelUrl ? commonRoot + distantStorageInfo.dappPdfRelUrl : null;
          this.raatReportLink = distantStorageInfo.raatPdfRelUrl ? commonRoot + distantStorageInfo.raatPdfRelUrl : null;
        } else {
          this.folderLink = null;
        }
        return this.loadResult();
      });
    } else {
      return this.loadResult();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.intervention.currentValue && JSON.stringify(changes.intervention.currentValue) !== JSON.stringify(changes.intervention.previousValue)) {
      this.setActionButton();
    }
  }

  loadResult(): void {
    this.identifyPrestations();
    this.identifyCheckedTypes()
      .then(() => {
        const prestationWithAnalyse: Prestation[] = this.intervention.asCreated().prestations.filter(p => p.technicalAct.hasAnalyse);
        if (prestationWithAnalyse.length > 0) {
          this.orderedAnalyses = this.order.orderLines.filter(ol => prestationWithAnalyse.map(p => p.analyse && p.analyse.orderLineId).indexOf(ol.uuid) > -1)
            .map(ol => ol.quantity)
            .reduce((p, c) => p + c, 0);
        } else {
          this.orderedAnalyses = 0;
        }
        this.setActionButton();
        this.loading = false;
      });
  }

  recipientDisplayer(recipient: ReportDestination): string {
    return new ReportDestinationDisplay(recipient).display();
  }

  getEstateType(): string {
    return this.estate.customEstateType ? this.estate.customEstateType : this.estate.estateType.type;
  }

  openDocument(event: Event, link: string): void {
    event.stopPropagation();
    window.open(link, '_blank');
  }

  identifyPrestations(): void {
    const prestations: Prestation[] = this.intervention.prestations;
    this.perfomedPrestationList = prestations.filter(presta => presta.resultId);
    this.plannedPrestationList = prestations.filter(presta => presta.orderLine);
    this.perfomedPrestationList.forEach(presta => {
      if (presta.technicalAct.hasAnalyse) {
        this.hasAnalyse = true;
      }
      // TODO increment analyse count depending if hasResult is true, not only for raat or dapp
      if (presta.technicalAct.shortcut === shortcuts.RAAT || presta.technicalAct.shortcut === shortcuts.DAPP) {
        this.resultsService.getAsbestos(presta.resultId).pipe(take(1)).subscribe((res: Asbestos) => {
          if (res) {
            if (presta.technicalAct.shortcut === shortcuts.RAAT) {
              this.raatResult = res;
            } else {
              this.dappResult = res;
            }
            if (Number.isInteger(res.analyseCount)) {
              this.analyseCountTotal = Number.isInteger(this.analyseCountTotal) ? this.analyseCountTotal + res.analyseCount : res.analyseCount;
            }
            if (Number.isInteger(res.analysesLabo)) {
              this.analysesLaboTotal = Number.isInteger(this.analysesLaboTotal) ? this.analysesLaboTotal + res.analysesLabo : res.analysesLabo;
            }
          }
        });
      } else if (presta.technicalAct.shortcut === shortcuts.ELEC) {
        this.resultsService.getElectricity(presta.resultId).pipe(take(1)).subscribe((res: Electricity) => {
          if (res) {
            this.elecResult = res;
          }
        });
      } else if (presta.technicalAct.shortcut === shortcuts.GAZ) {
        this.resultsService.getGas(presta.resultId).pipe(take(1)).subscribe((res: Gas) => {
          if (res) {
            this.gasResult = res;
          }
        });
      }
    });
  }

  identifyCheckedTypes(): Promise<void> {
    this.prestationCheckList = [];
    this.prestationCheckList = this.plannedPrestationList.map(presta => (
      {
        prestationId: presta.uuid,
        prestationTypeInput: presta.technicalAct,
        planned: true,
        performed: false
      }
    ));
    this.prestationCheckList.sort((a, b) => {
      const labelA = a.prestationTypeInput.shortcut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const labelB = b.prestationTypeInput.shortcut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (labelA < labelB) {
        return -1;
      } else if (labelA > labelB) {
        return 1;
      } else {
        return 0;
      }
    });

    this.perfomedPrestationList.forEach((presta: Prestation) => {
      const checkboxToUpdate: CheckPrestationTypeResult = this.prestationCheckList.find((value: CheckPrestationTypeResult) => value.prestationId === presta.uuid);
      if (presta.resultId && checkboxToUpdate) {
        checkboxToUpdate.performed = true;
      } else if (presta.resultId) {
        this.prestationCheckList.push({
          prestationId: presta.uuid,
          prestationTypeInput: presta.technicalAct,
          planned: false,
          performed: true
        });
      } else {
        console.error('should not have new prestation if it has no result, check this out: ' + JSON.stringify(presta));
      }
    });
    return Promise.resolve();
  }

  getFullAddress(address: Address) {
    return AddressUtils.getFullName(address);
  }

  editResults() {
    const data: ResultDialogInput = {
      intervention: this.intervention,
      resultList: [
        this.raatResult,
        this.dappResult,
        this.elecResult,
        this.gasResult
      ]
    };
    const dialogRef: MatDialogRef<InterventionResultsDialogComponent> = this.dialog.open(InterventionResultsDialogComponent, {data: data});

    dialogRef.afterClosed().pipe(take(1)).subscribe((isSaved) => {
      this.saveResult.next(isSaved);
    });
  }

  private setActionButton() {
    this.actionButton = [];

    if (this.intervention.isIncomplete) {
      this.actionButton.push({
        label: 'Valider manuellement les prestations',
        icon: 'create',
        function: () => this.editResults()
      });
    }

    if (this.folderLink) {
      this.actionButton.push({
        label: 'Consulter le rapport',
        icon: 'visibility',
        function: (link = this.folderLink) => window.open(link, '_blank')
      });
    }

    this.getActionButton.emit(this.actionButton);
  }
}

export interface CheckPrestationTypeResult {
  prestationId: string;
  prestationTypeInput: TechnicalAct;
  planned: boolean;
  performed: boolean;
}
