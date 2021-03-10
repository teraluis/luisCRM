import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LinesService} from '../../services/front/lines.service';
import {SortService} from '../../services/front/sort.service';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';
import {BpuReference, MarketsService} from '../../services/backend/markets.service';
import {shortcuts} from '../../services/backend/technical-act.service';
import {Analyse, Prestation} from '../../services/backend/prestations.service';
import {AnalyseType, DEFAULT_ANALYSE_TYPE_ID} from '../../services/backend/analyse-type.service';

@Component({
  selector: 'app-billlines',
  templateUrl: './billlines.component.html',
  styleUrls: ['./billlines.component.scss']
})
export class BilllinesComponent implements OnInit, OnDestroy {

  @Input() lineDraftsSubject: Observable<LineDraft[]>;
  @Input() beautifulTotal: boolean;
  @Input() disabled: Observable<boolean>;
  @Input() market: string;
  @Input() analyseTypeList: AnalyseType[];
  @Output() valueChange = new EventEmitter<LineDraft[]>();
  @Output() isValid = new EventEmitter<boolean>();

  lineDrafts: LineDraft[];
  lock: boolean;
  totalHT: number;
  totalTVA: number;
  total: number;
  references: BpuReference[];
  designations: BpuReference[];
  hasAction: boolean;

  defaultAnalyseType: AnalyseType;

  componentDestroyed: Subject<void> = new Subject();

  constructor(private lineServices: LinesService, private sortService: SortService, private marketsServices: MarketsService) {
  }

  ngOnInit() {
    this.disabled.pipe(takeUntil(this.componentDestroyed)).subscribe((lock) => {
      this.lock = lock;
    });
    this.lineDraftsSubject.pipe(takeUntil(this.componentDestroyed)).subscribe((lineDrafts) => {
      this.lineDrafts = lineDrafts;
      this.checkTotal(lineDrafts);
    });

    if (!!this.analyseTypeList) {
      this.defaultAnalyseType = this.analyseTypeList.find(at => at.uuid === DEFAULT_ANALYSE_TYPE_ID);
    } else {
      this.analyseTypeList = [];
    }
    if (!this.defaultAnalyseType) {
      this.defaultAnalyseType = {uuid: DEFAULT_ANALYSE_TYPE_ID, label: 'Analyse'};
      this.analyseTypeList.push(this.defaultAnalyseType);
    }
  }

  checkHasAction() {
    this.hasAction = this.canMakePack() || this.lineDrafts.filter(l => l.prestations.length > 1).length > 0;
  }

  canMakePack(): boolean {
    const selected: LineDraft[] = this.lineDrafts.filter(c => c.selected);
    const selectedPrestations: Prestation[] = [].concat(...selected.map(s => s.prestations));
    if (selected.length > 1 && selectedPrestations.filter(s => !s.technicalAct).length === 0) {
      const tvas: number[] = selectedPrestations.map(s => s.technicalAct.typeTVA);
      return tvas.every((val, i, arr) => val === arr[0]);
    } else {
      return false;
    }
  }

  changeValue(lineDraft: LineDraft) {
    lineDraft.checkNumber();
    this.checkTotal(this.lineDrafts);
    this.emitChange();
  }

  checkValue(lineDraft: LineDraft) {
    if (lineDraft.discount > 100) {
      lineDraft.discount = 100;
      this.changeValue(lineDraft);
    } else if (lineDraft.discount == null) {
      lineDraft.discount = 0;
      this.changeValue(lineDraft);
    }
  }

  checkTotal(lineDrafts: LineDraft[]) {
    let tempHt = 0;
    let temp = 0;
    let oneNull = false;
    if (lineDrafts.length === 0) {
      this.totalHT = null;
      this.total = null;
      this.totalTVA = null;
      this.isValid.emit(false);
    } else {
      for (const commandLine of lineDrafts) {
        if (!oneNull) {
          if (commandLine.priceWithoutTaxes !== null && commandLine.total !== null) {
            tempHt = tempHt + commandLine.priceWithoutTaxes;
            temp = temp + commandLine.total;
          } else {
            this.totalHT = null;
            this.total = null;
            this.totalTVA = null;
            oneNull = true;
            this.isValid.emit(false);
          }
        }
      }
      if (!oneNull) {
        this.totalHT = Math.round(tempHt * 10000) / 10000;
        this.total = Math.round(temp * 10000) / 10000;
        const tvaTemp = this.total - this.totalHT;
        this.totalTVA = Math.round(tvaTemp * 10000) / 10000;
        this.isValid.emit(true);
      }
    }
  }

  makePack() {
    const selectedLines: LineDraft[] = this.lineDrafts.filter(c => c.selected);
    const prestations: Prestation[] = [];
    let hasAnalyse = false;
    for (const selectedLine of selectedLines) {
      if (selectedLine.hasAnalyse) {
        hasAnalyse = true;
      }
      for (const prestation of selectedLine.prestations) {
        prestations.push(prestation);
      }
    }
    const newCommand = new LineDraft(null, prestations, this.lineServices.getRefAdx(prestations.map(p => p.technicalAct), hasAnalyse), hasAnalyse);
    this.lineDrafts = this.lineDrafts.filter(c => !c.selected);
    this.lineDrafts.push(newCommand);
    this.lineDrafts.sort((a, b) => {
      return this.sortService.sortOrderLineDraft(a, b);
    });
    this.emitChange();
  }

  deletePack(lineDraft: LineDraft) {
    const newLines: LineDraft[] = [];
    for (const prestation of lineDraft.prestations) {
      const newLine = new LineDraft(null, [prestation], this.lineServices.getRefAdx([prestation.technicalAct], false), false);
      newLines.push(newLine);
    }
    this.lineDrafts = this.lineDrafts.filter(l => l.refadx !== lineDraft.refadx);
    for (const newLine of newLines) {
      this.lineDrafts.push(newLine);
    }
    this.lineDrafts.sort((a, b) => {
      return this.sortService.sortOrderLineDraft(a, b);
    });
    this.emitChange();
  }

  suggestRef(l: LineDraft) {
    if (this.market) {
      // FIXME does not debounce as intended
      of(l.refBpu).pipe(debounceTime(300)).pipe(takeUntil(this.componentDestroyed)).subscribe((searchRef) => {
        if (searchRef && !l.designation) {
          this.marketsServices.suggestReferences(this.market, searchRef).pipe(take(1)).subscribe((references) => {
            if (references) {
              this.references = references;
            }
          });
        }
      });
    }
  }

  suggestDesignation(l: LineDraft) {
    if (this.market) {
      // FIXME does not debounce as intended
      of(l.designation).pipe(debounceTime(300)).pipe(takeUntil(this.componentDestroyed)).subscribe((searchDesignation) => {
        if (searchDesignation && !l.refBpu) {
          this.marketsServices.suggestReferencesFromDesignation(this.market, searchDesignation).pipe(take(1)).subscribe((references) => {
            if (references) {
              this.designations = references;
            }
          });
        }
      });
    }
  }

  selectReference(event, line: LineDraft, reference: BpuReference) {
    if (event.source.selected === true) {
      line.refBpu = reference.reference;
      line.designation = reference.designation;
      line.unitPrice = reference.price;
      this.changeValue(line);
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  updateAnalyseType(lineDraft: LineDraft, typeId: string): void {
    const analyseToChange: Analyse[] = this.getAnalyseList(lineDraft);
    analyseToChange.forEach(anal => anal.type.uuid = typeId);
    this.emitChange();
  }

  getAnalyseTypeId(lineDraft: LineDraft): string {
    const analyseList = this.getAnalyseList(lineDraft);
    return analyseList.length > 0 ? analyseList[0].type.uuid : this.defaultAnalyseType.uuid;
  }

  getAnalyseList(lineDraft: LineDraft): Analyse[] {
    const analyseList: Analyse[] = [];
    // when prestation and analyse exist and have their own id
    if (lineDraft.prestations.length > 0 && lineDraft.prestations.some(p => !!p.analyse)) {
      const analyseIdsToGet: string[] = lineDraft.prestations.filter(p => !!p.analyse).map(p => p.analyse.uuid);
      analyseList.push(...this.lineDrafts.filter(ld => ld.prestations.length > 0).map(ld => ld.prestations).flat()
        .filter(p => !!p.analyse && analyseIdsToGet.includes(p.analyse.uuid)).map(p => p.analyse));

    // in case of new prestation with new analyse with temp id
    } else {
      analyseList.push(...this.lineDrafts.filter(ld => ld.prestations.length > 0).map(ld => ld.prestations).flat()
        .filter(p => !!p.analyse).map(p => p.analyse).filter(a => a.orderLineId === lineDraft.uuid));
    }
    return analyseList;
  }

  emitChange(): void {
    this.valueChange.emit(this.lineDrafts);
  }

}


export class LineDraft {
  uuid: string;
  refadx: string;
  prestations: Prestation[];
  refBpu: string;
  designation: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  priceWithoutTaxes: number;
  tvacode: string;
  total: number;
  hasAnalyse: boolean;
  selected: boolean;
  orderLineId?: string;

  constructor(uuid: string, prestations: Prestation[], refAdx: string, hasAnalyse: boolean) {
    this.uuid = uuid;
    this.prestations = prestations;
    this.refadx = refAdx;
    this.hasAnalyse = hasAnalyse;
    this.quantity = 1;
    this.discount = 0;
    this.tvacode = '20%';
    this.selected = false;
    this.unitPrice = null;
    this.priceWithoutTaxes = null;
    this.total = null;
  }

  checkNumber() {
    if (this.unitPrice !== null && this.quantity !== null && this.discount !== null) {
      this.unitPrice = Math.round(this.unitPrice * 10000) / 10000;
      let priceTemp: number;
      priceTemp = this.unitPrice * this.quantity;
      priceTemp = priceTemp - ((this.discount / 100) * priceTemp);
      this.priceWithoutTaxes = Math.round(priceTemp * 10000) / 10000;
      const finalTemp = this.priceWithoutTaxes + 0.2 * this.priceWithoutTaxes;
      this.total = Math.round(finalTemp * 10000) / 10000;
    } else {
      this.priceWithoutTaxes = null;
      this.total = null;
    }
  }

  toKeep(prestationId: string): boolean {
    const toRemove: boolean = this.prestations.length === 1 && this.prestations[0].technicalAct.uuid === prestationId && !this.hasAnalyse;
    return !toRemove;
  }

  remove(prestationId: string) {
    const oldCount = this.prestations.length;
    this.prestations = this.prestations.filter(p => p.technicalAct.uuid !== prestationId);
    const newCount = this.prestations.length;
    if (oldCount !== newCount) {
      this.refBpu = null;
      this.designation = null;
      this.quantity = 1;
      this.discount = 0;
      this.tvacode = '20%';
      this.selected = false;
      this.unitPrice = null;
      this.priceWithoutTaxes = null;
      this.total = null;
    }
  }

  hasRaat(): boolean {
    return this.prestations.filter(p => p.technicalAct.shortcut === shortcuts.RAAT).length > 0;
  }

  isValid(): boolean {
    return this.total !== null;
  }

  clone(): LineDraft {
    const orderLineDraft = new LineDraft(null, this.prestations, this.refadx, this.hasAnalyse);
    orderLineDraft.refBpu = this.refBpu;
    orderLineDraft.designation = this.designation;
    orderLineDraft.unitPrice = this.unitPrice;
    orderLineDraft.quantity = this.quantity;
    orderLineDraft.priceWithoutTaxes = this.priceWithoutTaxes;
    orderLineDraft.discount = this.discount;
    orderLineDraft.tvacode = this.tvacode;
    orderLineDraft.total = this.total;
    orderLineDraft.selected = this.selected;
    return orderLineDraft;
  }

}
