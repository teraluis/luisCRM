import {Component, Inject, OnInit} from '@angular/core';
import {IncompleteIntervention, MaterializedIntervention} from '../../../services/backend/interventions.service';
import {InfoService} from '../../../services/front/info.service';
import {shortcuts, TechnicalAct, TechnicalActService} from '../../../services/backend/technical-act.service';
import {take, takeUntil} from 'rxjs/operators';
import {DistantStorageInfo, ExternalDocFormData, ReportService} from '../../../services/backend/report.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {Result, ResultsService, ResultWithAnalyse} from '../../../services/backend/results.service';
import {PrestationForm, Prestation, PrestationsService, AnalyseForm} from '../../../services/backend/prestations.service';
import {UUID} from '../../../core/UUID';
import {DEFAULT_ANALYSE_TYPE_ID} from '../../../services/backend/analyse-type.service';
import {Subject} from 'rxjs';
import {HttpEventType} from '@angular/common/http';

@Component({
  selector: 'app-intervention-results',
  templateUrl: 'intervention-results-dialog.component.html',
  styleUrls: ['intervention-results-dialog.component.scss']
})

export class InterventionResultsDialogComponent implements OnInit {
  dialogClosed: Subject<void> = new Subject<void>();

  // modal inputs
  intervention: MaterializedIntervention;
  resultList: Result[];

  // modal vars
  isLoading: boolean;
  isSaving: boolean;
  isUnlocked: boolean;

  // services
  infoService: InfoService;
  technicalActService: TechnicalActService;
  reportService: ReportService;

  // vars
  fullTechnicalActList: TechnicalAct[];
  orderedPrestaList: Prestation[];
  realisedPrestaList: Prestation[];
  incompleteIntervention: IncompleteIntervention;
  distantStorageInfo: DistantStorageInfo;
  resultSelectionList: ResultSelection[];
  resultsService: ResultsService;
  prestationsService: PrestationsService;
  spUrl: string;

  updatableUrls: string[] = [ /* TODO update the list when report services will be able to handle the others (1/3) */
    shortcuts.RAAT,
    shortcuts.DAPP,
    shortcuts.GAZ,
    shortcuts.ELEC
  ];

  file: File;
  progress: number;

  constructor(@Inject(MAT_DIALOG_DATA) data: ResultDialogInput,
              public dialogRef: MatDialogRef<InterventionResultsDialogComponent>,
              infoService: InfoService,
              technicalActService: TechnicalActService,
              reportService: ReportService,
              resultsService: ResultsService,
              prestationsService: PrestationsService) {
    this.infoService = infoService;
    this.technicalActService = technicalActService;
    this.reportService = reportService;
    this.resultsService = resultsService;
    this.prestationsService = prestationsService;
    this.intervention = data.intervention;
    this.resultList = data.resultList;
    this.resultSelectionList = [];
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.isSaving = false;
    this.progress = 0;

    this.initTechnicalActList()
      .then(() => this.initIntervention())
      .then(() => this.initPrestations())
      .then(() => this.initDistantStorageInfo())
      .then(() => this.initResultSelectionList())
      .then(() => {
        this.isUnlocked = true;
        this.isLoading = false;
        this.dialogRef.updateSize('40%');
      })
      .catch(msg => {
        console.error('could not init the dialog component: ', msg);
        this.closeWithError('Echec à l\'initialisation de la fenêtre modale.');
      });
    this.dialogRef.beforeClosed().pipe(take(1)).subscribe(value => this.dialogClosed.next());
  }

  // get list of possible technical acts
  initTechnicalActList(): Promise<void> {
    return this.technicalActService.getAll().pipe(takeUntil(this.dialogClosed)).toPromise()
      .then(res => {
        this.fullTechnicalActList = res.sort((a, b) => a.shortcut > b.shortcut ? 1 : (a.shortcut < b.shortcut ? -1 : 0));
      });
  }

  // set intervention as incomplete
  initIntervention(): Promise<void> {
    if (!!this.intervention && this.intervention.isIncomplete) {
      this.incompleteIntervention = this.intervention.asIncomplete();
      return Promise.resolve();
    } else {
      return Promise.reject('L\'intervention n\'est pas au statut \'incomplet\'');
    }
  }

  // set ordered and realised prestations from intervention input, must have at least 1 prestation
  initPrestations(): Promise<void> {
    if (this.incompleteIntervention.prestations.length > 0) {
      this.orderedPrestaList = this.incompleteIntervention.prestations.filter(presta => !!presta.orderLine);
      this.realisedPrestaList = this.incompleteIntervention.prestations.filter(presta => !!presta.resultId);
      return Promise.resolve();
    } else {
      return Promise.reject('L\'intervention n\'a aucune prestation');
    }
  }

  // get existing distant storage info
  initDistantStorageInfo(): Promise<void> {
    return this.reportService.getStorageInfo(this.incompleteIntervention.parameters.reportId).pipe(takeUntil(this.dialogClosed)).toPromise()
      .then(res => {
        this.distantStorageInfo = res;
        this.spUrl = this.distantStorageInfo.baseUrl + '/' + this.distantStorageInfo.library + '/';
      });
  }

  // set starting values for result selection items
  initResultSelectionList(): Promise<void> {
    this.fullTechnicalActList.forEach(fta => {
      const maybeOrderedPrestation: Prestation | undefined = this.orderedPrestaList.find(v => v.technicalAct.uuid === fta.uuid);
      const isOrdered: boolean = !!maybeOrderedPrestation;
      const maybeRealisedPrestation: Prestation | undefined = this.realisedPrestaList.find(v => v.technicalAct.uuid === fta.uuid);
      const isRealised: boolean = !!maybeRealisedPrestation;
      let sq;
      let aq;
      if (fta.hasAnalyse && isRealised) {
        const maybeResultWithAnalyse: ResultWithAnalyse | undefined = this.resultList.find(r => r.prestationId === maybeRealisedPrestation.uuid) as ResultWithAnalyse;
        sq = !!maybeResultWithAnalyse ? maybeResultWithAnalyse.analyseCount : 0;
        aq = !!maybeResultWithAnalyse ? maybeResultWithAnalyse.analysesLabo : 0;
      } else {
        sq = 0;
        aq = 0;
      }
      this.resultSelectionList.push({
        id: fta.uuid,
        label: fta.shortcut,
        prestationId: isOrdered ? maybeOrderedPrestation.uuid : undefined,
        hasUrl: this.updatableUrls.includes(fta.shortcut),
        hasAnalyse: fta.hasAnalyse,
        isSelected: isOrdered || isRealised,
        isOrdered: isOrdered,
        isRealised: isRealised,
        sampleQuantity: sq,
        analyseQuantity: aq
      });
    });
    return Promise.resolve();
  }

  canSave(): boolean {
    const allQuantitiesFulfilled = this.resultSelectionList.findIndex(ta => (ta.isSelected && Number.isInteger(ta.sampleQuantity) && Number.isInteger(ta.analyseQuantity))) > -1;
    return this.isUnlocked && !this.isLoading && allQuantitiesFulfilled && !!this.file;
  }

  closeWithError(msg: string) {
    this.isUnlocked = false;
    this.isLoading = false;
    this.infoService.displayError(msg);
    this.progress = 0;
    this.dialogRef.close(false);
  }

  toggleSelection(idx: number): void {
    this.resultSelectionList[idx].isSelected = !this.resultSelectionList[idx].isSelected;
  }

  updateSampleQ(idx: number, q: number): void {
    this.resultSelectionList[idx].sampleQuantity = q;
  }

  updateAnalyseQ(idx: number, q: number): void {
    this.resultSelectionList[idx].analyseQuantity = q;
  }

  save(): void {
    this.progress = 0;
    this.isSaving = true;
    this.dialogRef.disableClose = true;

    const interTypeResume = this.resultSelectionList.map(sel => sel.label).reduce((previousLabel, currentLabel) => previousLabel + ', ' + currentLabel, '');
      //  TODO complete form with known data
    const externalDoc: ExternalDocFormData = {
      file: this.file,
      interventionId: this.incompleteIntervention.id,
      interventionName: this.incompleteIntervention.name,
      interventionDate: this.incompleteIntervention.parameters.interventionDate,
      interventionType: interTypeResume,
      expert: this.incompleteIntervention.parameters.expertLabel,
      estateAddress: this.incompleteIntervention.estateAddress, // FIXME it contains the already concatenated address instead of separated fields
    };
    this.uploadManuelReportPromise(externalDoc).then(storageInfo => {
      this.progress = 70;
      const promises: Promise<boolean>[] = this.resultSelectionList.filter(sel => !sel.isRealised && sel.isSelected).map(sel => {
        if (!!sel.prestationId) {
          return this.addResultPromise(sel, sel.prestationId)
            .then(resUuidObj => this.associateResultPromise(sel.prestationId, resUuidObj));
        } else {
          return this.addPrestationPrommise(sel)
            .then(uuidObj => {
              sel.prestationId = uuidObj.uuid;
              return this.addResultPromise(sel, uuidObj.uuid);
            })
            .then(resUuidObj => this.associateResultPromise(sel.prestationId, resUuidObj));
        }
      });
      // if parallel tasks from promise.all are too heavy, here is a sequential solution (but it will be much longer to wait):
      // return promises.reduce((previousValue, currentValue) => previousValue.then(() => currentValue), Promise.resolve(true));
      return Promise.all(promises).then((res) => res.every(r => r));
    })
      .then(finalRes => {
        this.progress = 99;
        if (finalRes) {
          this.progress = 100;
          setTimeout(() => {
            this.isSaving = false;
            this.infoService.displaySaveSuccess();
            this.dialogRef.close(true);
          }, 300);
        } else {
          return Promise.reject('could not create or append all selected results to prestations');
        }
      })
      .catch(err => {
        console.error('error while saving: ', err);
        this.closeWithError('Echec de l\'enregistrement des données.');
      });
  }

  uploadManuelReportPromise(externalDoc: ExternalDocFormData): Promise<DistantStorageInfo> {
    return new Promise<DistantStorageInfo>((resolve, reject) => {
      this.reportService.uploadManualReport(externalDoc).pipe(takeUntil(this.dialogClosed)).subscribe(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            this.progress = Math.round(event.loaded / event.total * 50);
            break;
          case HttpEventType.Response:
            this.progress = 60;
            if (event.ok && event.body !== null) {
              resolve(event.body);
            } else {
              reject();
            }
            break;
        }
      });

    });
  }

  addPrestationPrommise(selection: ResultSelection): Promise<UUID> {
    const firstPrestation = this.incompleteIntervention.prestations[0];
    const analyse: AnalyseForm = (selection.hasAnalyse) ? {typeId: DEFAULT_ANALYSE_TYPE_ID} : null;
    const newPrestation: PrestationForm = {
      order: firstPrestation.order,
      mission: this.incompleteIntervention.id,
      technicalActId: selection.id,
      estate: firstPrestation.estate,
      targetId: firstPrestation.targetId,
      estateType: firstPrestation.estateType,
      analyse: analyse
    };
    return this.prestationsService.add(newPrestation).pipe(take(1)).toPromise()
      .then(res => !!res ? Promise.resolve(res) : Promise.reject('could not add prestation for technical act ' + selection.label));
  }

  addResultPromise(selection: ResultSelection, prestationId: string): Promise<UUID> {
    const shortcut: shortcuts = shortcuts[selection.label as keyof typeof shortcuts];
    if (!shortcut) {
      return Promise.reject('Could not find shortcut with label: ' + selection.label);
    } else {
      return this.resultsService.add(shortcut, prestationId, selection.hasAnalyse ? selection.sampleQuantity : undefined, selection.hasAnalyse ? selection.analyseQuantity : undefined).pipe(take(1)).toPromise()
        .then(res => !!res ? Promise.resolve(res) : Promise.reject('could not add result for technical act ' + selection.label + ' with prestation id ' + prestationId));
    }
  }

  associateResultPromise(prestationId: string, resultId: UUID): Promise<boolean> {
    return this.prestationsService.associateResult(prestationId, resultId).pipe(take(1)).toPromise()
      .then(res => !!res ? Promise.resolve(res) : Promise.reject('could not associate result ' + resultId + ' to prestation ' + prestationId));
  }

  preventEventKeyboard(event) {
    event.preventDefault();
  }

  loadFile(event) {
    this.file = event.target.files.item(0);
  }

  clearFile() {
    this.file = null;
  }
}

export interface ResultSelection {
  id: string; /* ref to technicalAct id */
  label: string; /* ref to technicalAct shortcut */
  prestationId?: string;
  hasUrl: boolean;
  hasAnalyse: boolean;
  isOrdered: boolean;
  isRealised: boolean;
  isSelected: boolean;
  sampleQuantity: number; /* nombre de prélèvements réalisés par l'expert -> analyseCount */
  analyseQuantity: number; /* nombre d'analyses faites par le labo -> analyseLabo */
}

export interface ResultDialogInput {
  intervention: MaterializedIntervention;
  resultList: Result[];
}
