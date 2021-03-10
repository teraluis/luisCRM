import {Component, Inject, OnInit} from '@angular/core';
import {BehaviorSubject, forkJoin, Subject} from 'rxjs';
import {ITechnicalAct, shortcuts, TechnicalAct, TechnicalActService} from '../../../services/backend/technical-act.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {Order, OrderLine, OrderLineWithPrestations, OrdersService, SetOrderLines} from '../../../services/backend/orders.service';
import {MarketAttachmentTypes} from '../../../services/backend/markets.service';
import {SortService} from '../../../services/front/sort.service';
import {LinesService} from '../../../services/front/lines.service';
import {InfoService} from '../../../services/front/info.service';
import {LineDraft} from '../../billlines/billlines.component';
import {Prestation, PrestationEstateType} from '../../../services/backend/prestations.service';
import {ListEstateTableLine} from '../order-estate/order-estate.component';
import {AttachmentsService, IAttachment} from '../../../services/backend/attachments.service';
import {AnalyseType, AnalyseTypeService, DEFAULT_ANALYSE_TYPE_ID} from '../../../services/backend/analyse-type.service';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-orderprestation',
  templateUrl: './order-prestation-dialog.component.html',
  styleUrls: ['./order-prestation-dialog.component.scss']
})
export class OrderPrestationDialogComponent implements OnInit {

  currentData: PrestationData;
  defaultData: { [key: string]: PrestationData } = {};

  isLoading = false;
  saving = false;
  disabledSubject: Subject<boolean>;
  breakpoint: number;
  displayTextArea: boolean;
  selectedBpuFile: IAttachment;
  types: TechnicalAct[];
  options: AutocompleteSelectOption<TechnicalAct>[] = [];
  isSingleEstate: boolean;
  warning: boolean;
  warningMessage: string;
  previousSelectedOptions = 0;
  progressValue = 0;
  analyseTypeList: AnalyseType[] = [];
  bpuAttachments: IAttachment[] = [];

  private tempId = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderPrestationData,
              public dialogRef: MatDialogRef<OrderPrestationDialogComponent>,
              private ordersService: OrdersService,
              private sortService: SortService,
              public linesService: LinesService,
              public infoService: InfoService,
              private technicalActService: TechnicalActService,
              private attachmentsService: AttachmentsService,
              private analyseTypeService: AnalyseTypeService) {
  }

  ngOnInit() {
    this.isLoading = true;
    this.isSingleEstate = this.data.prestationsWithTableLine.length === 1;
    if (!this.isSingleEstate && this.data.prestationsWithTableLine.filter(p => p.estateTableLine.prestations.length > 0).length > 0) {
      this.warning = true;
      this.warningMessage = 'Des prestations ont déjà été définies sur l\'un des biens : si elle sont redéfinies ici, les précédentes seront remplacées.';
    } else if (this.isSingleEstate && this.data.prestationsWithTableLine[0].estateTableLine.estateInterventionStatus === 'ingeo') {
      this.warning = true;
      this.warningMessage = 'L\'intervention est potentiellement dans Géoconcept : n\'oubliez pas d\'y mettre à jour les informations.';
    } else if (this.isSingleEstate && this.data.prestationsWithTableLine[0].estateTableLine.estateInterventionStatus === 'imminent') {
      this.warning = true;
      this.warningMessage = 'L\'expert a déjà reçu les informations sur l\'intervention : n\'oubliez pas de le mettre au courant !';
    }
    if (this.isSingleEstate) {
      this.initializeCurrentData(this.data.prestationsWithTableLine[0]);
    } else {
      this.initializeCurrentData();
    }
    this.data.prestationsWithTableLine.forEach(estate => {
      this.initializeDefaultData(estate);
    });
    this.displayTextArea = false;
    this.breakpoint = (window.innerWidth <= 400) ? 1 : 6;
    this.disabledSubject = new BehaviorSubject(this.data.disabled);
    forkJoin(this.technicalActService.getAll().pipe(take(1)), this.analyseTypeService.getAll().pipe(take(1)))
      .subscribe(([technicalActList, analyseTypeList]: [ITechnicalAct[], AnalyseType[]]) => {
        this.initialize(technicalActList);
        this.analyseTypeList = analyseTypeList;
        this.isLoading = false;
      });

    if (this.data.order.market) {
      this.attachmentsService.getByEntityId(this.data.order.market.uuid).subscribe((res) => {
        res.forEach(att => {
          if (att.attachmentType === MarketAttachmentTypes.BPU) {
            this.bpuAttachments.push(att);
          }
        });
      });
    }
  }

  initializeDefaultData(data: PrestationsWithTableLine) {
    this.defaultData[data.estateTableLine.targetId] = {};
    this.defaultData[data.estateTableLine.targetId].workDescription = data.prestations && !!data.prestations.find(p => !!p.workDescription) ? data.prestations.find(p => !!p.workDescription).workDescription : '';
    this.defaultData[data.estateTableLine.targetId].commentary = data.prestations && !!data.prestations.find(p => !!p.comment) ? data.prestations.find(p => !!p.comment).comment : '';
    this.defaultData[data.estateTableLine.targetId].commandLines = [];
    this.defaultData[data.estateTableLine.targetId].oldPrestations = data.prestations;
    this.defaultData[data.estateTableLine.targetId].total = null;
    this.defaultData[data.estateTableLine.targetId].totalHT = null;
    this.defaultData[data.estateTableLine.targetId].lineDrafts = new BehaviorSubject(this.defaultData[data.estateTableLine.targetId].commandLines);
    this.defaultData[data.estateTableLine.targetId].selectedOptions = [];
  }

  initializeCurrentData(data?: PrestationsWithTableLine) {
    this.currentData = {};
    this.currentData.workDescription = data && data.prestations && !!data.prestations.find(p => !!p.workDescription) ? data.prestations.find(p => !!p.workDescription).workDescription : '';
    this.currentData.commentary = data && data.prestations && !!data.prestations.find(p => !!p.comment) ? data.prestations.find(p => !!p.comment).comment : '';
    this.currentData.commandLines = [];
    this.currentData.oldPrestations = data ? data.prestations : [];
    this.currentData.total = null;
    this.currentData.totalHT = null;
    this.currentData.lineDrafts = new BehaviorSubject(this.currentData.commandLines);
    this.currentData.selectedOptions = [];
  }

  initialize(technicalActs: TechnicalAct[]) {
    this.types = technicalActs;
    this.options = this.types.map(e => new AutocompleteSelectOption((e.shortcut + ' - ' + e.name), e));
    this.options.sort((a, b) => {
      return a.display < b.display ? -1 : (a.display > b.display) ? 1 : 0;
    });
    this.data.prestationsWithTableLine.forEach((data) => {
      const targetId = data.estateTableLine.targetId;
      const prestations = this.defaultData[targetId].oldPrestations;
      this.defaultData[targetId].selectedOptions = this.options
        .filter(o => prestations.filter(p => p.technicalAct && p.orderLine).map(p => p.technicalAct.uuid).includes(o.value.uuid))
        .map(o => o.value);
      if (this.isSingleEstate) {
        this.currentData.selectedOptions = this.options
          .filter(o => prestations.filter(p => p.technicalAct && p.orderLine).map(p => p.technicalAct.uuid).includes(o.value.uuid))
          .map(o => o.value);
      }
      if (this.isSingleEstate) {
        this.previousSelectedOptions = this.currentData.selectedOptions.length;
      }
      const orderLines: OrderLine[] = this.data.order.orderLines.filter(o => prestations.map(p => p.orderLine).includes(o.uuid));
      this.data.order.orderLines
        .filter(ol => prestations.filter(p => p.analyse && p.analyse.orderLineId).map(p => p.analyse.orderLineId).includes(ol.uuid))
        .forEach(aol => orderLines.push(aol));
      for (const orderLine of orderLines) {
        const linePrestations: Prestation[] = prestations.filter((p) => p.technicalAct && p.orderLine === orderLine.uuid);
        const orderLineDraft = new LineDraft(orderLine.uuid, linePrestations, orderLine.refadx, linePrestations.length === 0);
        orderLineDraft.designation = orderLine.designation;
        orderLineDraft.refBpu = orderLine.refbpu;
        orderLineDraft.unitPrice = orderLine.price;
        orderLineDraft.quantity = orderLine.quantity;
        orderLineDraft.discount = orderLine.discount;
        orderLineDraft.checkNumber();
        orderLineDraft.prestations = prestations.filter(p => p.orderLine === orderLine.uuid);
        this.defaultData[targetId].commandLines.push(orderLineDraft);
        if (this.isSingleEstate) {
          this.currentData.commandLines.push(orderLineDraft);
        }
      }
      this.defaultData[targetId].commandLines.sort((a, b) => {
        return this.sortService.sortOrderLineDraft(a, b);
      });
      if (this.isSingleEstate) {
        this.currentData.commandLines.sort((a, b) => {
          return this.sortService.sortOrderLineDraft(a, b);
        });
      }
      this.defaultData[targetId].lineDrafts.next(this.currentData.commandLines);
      if (this.isSingleEstate) {
        this.currentData.lineDrafts.next(this.currentData.commandLines);
      }
      if (this.isSingleEstate && this.checkComplete()) {
        this.currentData.total = 0;
        for (const line of this.currentData.commandLines) {
          this.currentData.total = this.currentData.total + line.total;
        }
        this.currentData.total = Math.round(this.currentData.total * 10000) / 10000;
      }
    });
    this.checkPrestationType();
  }

  checkComplete(): boolean {
    return this.currentData.commandLines.length > 0 && this.currentData.commandLines.every(c => c.isValid());
  }

  checkPrestationTypes(selectedTechnicalActList: TechnicalAct[]) {
    this.currentData.selectedOptions = selectedTechnicalActList;
    // se déroule avant le changement de checked
    const flatCommandLinesTechnicalActs: ITechnicalAct[] = this.currentData.commandLines.map(ld => ld.prestations.filter(p => p.technicalAct).map(p => p.technicalAct)).flat();

    if (this.previousSelectedOptions < selectedTechnicalActList.length) {
      selectedTechnicalActList.filter(t => !flatCommandLinesTechnicalActs.map(f => f.uuid).includes(t.uuid)).forEach(newTA => {

        if (newTA.hasAnalyse) {
          const id = this.getNextTempId();
          this.currentData.commandLines.push(new LineDraft(null, [{
            uuid: null,
            order: this.data.order.uuid,
            technicalAct: newTA,
            billLines: [],
            analyse: {
              uuid: id,
              type: {
                uuid: DEFAULT_ANALYSE_TYPE_ID
              }
            }
          }], this.linesService.getRefAdx([newTA], false), false));
          this.currentData.commandLines.push(new LineDraft(id, [], this.linesService.getRefAdx([], true), true));

        } else {
          this.currentData.commandLines.push(new LineDraft(null, [{
            uuid: null,
            order: this.data.order.uuid,
            technicalAct: newTA,
            billLines: []
          }], this.linesService.getRefAdx([newTA], false), false));
        }

      });
    } else {
      flatCommandLinesTechnicalActs.filter(t => !selectedTechnicalActList.map(f => f.uuid).includes(t.uuid)).forEach(removeElement => {
        this.currentData.commandLines = this.currentData.commandLines
          .filter((e: LineDraft) => (e.prestations.length === 1 && e.prestations.map(p => p.technicalAct)[0].uuid !== removeElement.uuid) || e.prestations.length !== 1);
        const notContainingRaat = this.currentData.commandLines.map((e: LineDraft) => {
          e.remove(removeElement.uuid);
          e.refadx = this.linesService.getRefAdx(e.prestations.map(p => p.technicalAct), e.hasAnalyse);
          return !e.hasRaat();
        }).some(e => !e);

        if (!notContainingRaat) {
          this.currentData.commandLines = this.currentData.commandLines.filter((c: LineDraft) => c.prestations.length);
          this.currentData.commandLines.forEach((e: LineDraft) => {
            e.hasAnalyse = false;
            e.refadx = this.linesService.getRefAdx(e.prestations.map(p => p.technicalAct), false);
          });
        }
      });
    }
    this.previousSelectedOptions = selectedTechnicalActList.length;
    this.currentData.commandLines.sort((a, b) => {
      return this.sortService.sortOrderLineDraft(a, b);
    });
    this.checkPrestationType();
    this.currentData.lineDrafts.next(this.currentData.commandLines);
  }

  checkPrestationType() {
    this.displayTextArea = this.currentData.selectedOptions.some((presta) => presta.shortcut === shortcuts.RAAT);
  }

  marketTooltip() {
    const value = this.valueFacturationAnalysis();
    return "Conditions de facturation : " + value;
  }

  valueFacturationAnalysis() {
    let result = this.data.order.market.facturationAnalysis;
    for (const establishment of this.data.order.market.marketEstablishments) {
      if (establishment.role === "Client" && establishment.establishment.facturationAnalysis !== null) {
        result = establishment.establishment.facturationAnalysis;
      }
    }
    return result;
  }

  downloadBpu() {
    if (this.selectedBpuFile) {
      this.attachmentsService.getFile(this.data.order.market.uuid, this.selectedBpuFile.filename, 'markets').subscribe((blob) => {
        if (blob) {
          const data = window.URL.createObjectURL(blob);
          window.open(data, '_blank');
        }
      });
    }
  }

  saveAll() {
    const setOrderLinesBatch: SetOrderLines[] = [];
    this.data.prestationsWithTableLine.forEach((data: PrestationsWithTableLine) => {
      if (this.checkComplete()) {
        this.saving = true;
        this.disabledSubject.next(true);
        this.currentData.total = Math.round(this.currentData.commandLines.map(cl => cl.total).reduce((prev, curr) => prev + curr, 0) * 10000) / 10000;
        const orderLines: OrderLineWithPrestations[] = this.currentData.commandLines.filter(c => c.prestations.length > 0 && !c.hasAnalyse).map(c => {
          const orderLine: OrderLine = {
            uuid: c.uuid,
            refadx: c.refadx,
            refbpu: c.refBpu,
            designation: c.designation,
            price: c.unitPrice,
            quantity: c.quantity,
            discount: c.discount,
            tvacode: c.tvacode,
            total: c.total
          };
          const prestations: Prestation[] = c.prestations.map(p => {
            const presta: Prestation = {
              uuid: p.uuid,
              order: this.data.order.uuid,
              estate: data.estateTableLine.id,
              targetId: data.estateTableLine.targetId,
              estateType: data.estateTableLine.estateType,
              technicalAct: p.technicalAct,
              comment: !this.isSingleEstate && this.defaultData[data.estateTableLine.targetId].commentary
                ? this.defaultData[data.estateTableLine.targetId].commentary + ' / ' + this.currentData.commentary
                : this.currentData.commentary,
              workDescription: !this.isSingleEstate && this.defaultData[data.estateTableLine.targetId].workDescription
                ? this.defaultData[data.estateTableLine.targetId].workDescription + ' / ' + this.currentData.workDescription
                : this.currentData.workDescription,
              billLines: [],
              mission: data.estateTableLine.interventionId,
              analyse: p.analyse
            };
            return presta;
          });
          const result: OrderLineWithPrestations = {orderLine: orderLine, prestations: prestations};
          return result;
        });
        // If isSingleEstate, delete all oldPrestations and add currentData
        // else, delete only oldPrestations that will be replaced by currentData
        const prestationEstate: Prestation[] = this.defaultData[data.estateTableLine.targetId].oldPrestations
          .filter(p => this.isSingleEstate || !p.technicalAct || !!this.currentData.commandLines.find(c => c.refadx === p.technicalAct.shortcut));
        const analyseOrderLines: OrderLine[] = this.currentData.commandLines.filter(c => c.hasAnalyse).map(cl => {
          return {
            uuid: cl.uuid,
            refadx: cl.refadx,
            refbpu: cl.refBpu,
            designation: cl.designation,
            price: cl.unitPrice,
            quantity: cl.quantity,
            discount: cl.discount,
            tvacode: cl.tvacode,
            total: cl.total
          } as OrderLine;
        });
        const setOrderLines: SetOrderLines = {
          oldPrestations: prestationEstate,
          newPrestations: orderLines,
          analyseOrderLines: analyseOrderLines
        };
        setOrderLinesBatch.push(setOrderLines);
      } else {
        this.saving = false;
        this.disabledSubject.next(false);
        this.currentData.total = null;
        this.infoService.displayError('Lignes de commande incomplètes.');
      }
    });
    this.ordersService.setOrderLinesInBatch(this.data.order.uuid, setOrderLinesBatch).pipe(take(1)).subscribe((success) => {
      if (success) {
        this.saving = false;
        this.progressValue = 0;
        this.dialogRef.close(true);
        this.infoService.displaySaveSuccess();
      } else {
        this.saving = false;
        this.progressValue = 0;
        this.dialogRef.close(false);
        this.infoService.displayError('Echec de l\'enregistrement des lignes de commande.');
      }
    });
  }

  getEstateIcon(data: PrestationsWithTableLine) {
    switch (data.estateTableLine.estateType) {
      case PrestationEstateType.PREMISES:
        return 'house';
      case PrestationEstateType.ANNEX:
        return 'house_siding';
    }
  }

  getEstateIconTooltip(data: PrestationsWithTableLine) {
    switch (data.estateTableLine.estateType) {
      case PrestationEstateType.PREMISES:
        return 'Local';
      case PrestationEstateType.ANNEX:
        return 'Annexe';
    }
  }

  getNextTempId(): string {
    return (this.tempId++).toString();
  }


}

export class CheckPrestationType {
  prestationTypeInput: TechnicalAct;
  checked: boolean;

  constructor(prestationTypeInput: TechnicalAct, checked: boolean) {
    this.prestationTypeInput = prestationTypeInput;
    this.checked = checked;
  }

}

class AutocompleteSelectOption<T> {
  display: string;
  value: T;

  constructor(display: string, value: T) {
    this.value = value;
    this.display = display;
  }
}

export interface OrderPrestationData {
  order: Order;
  prestationsWithTableLine: PrestationsWithTableLine[];
  market: string;
  disabled: boolean;
}

export interface PrestationsWithTableLine {
  prestations: Prestation[];
  estateTableLine: ListEstateTableLine;
}

export interface PrestationData {
  workDescription?: string;
  commentary?: string;
  commandLines?: LineDraft[];
  oldPrestations?: Prestation[];
  total?: number;
  totalHT?: number;
  lineDrafts?: Subject<LineDraft[]>;
  selectedOptions?: TechnicalAct[];
}
