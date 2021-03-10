import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ITechnicalAct, TechnicalAct, TechnicalActService, tvaEnum} from '../../services/backend/technical-act.service';
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: 'app-technical-act-form',
  templateUrl: './technical-act-form.component.html'
})
export class TechnicalActFormComponent implements OnInit {

  @Input() data: TechnicalActFormData;

  @Output() actSaved = new EventEmitter<ITechnicalAct>();
  @Output() cancelAction = new EventEmitter<void>();

  saving = false;
  technicalActForm: FormGroup;
  tvaEnum = Object.values(tvaEnum).filter(e => parseInt(e, 10) >= 0);

  typeControl = new FormControl('');
  typeOptions: string[] = ['Acte technique', 'Formation', 'Achat Revente', 'Numérique', 'Expertise', 'Non Actif'];
  typeFilteredOptions: Observable<string[]>;
  prestationCodes: string[] = [];

  shortcutControl = new FormControl('');
  shortcutOptions: string[] = ['DAPP', 'GAZ', 'ELEC', 'DPE', 'PLOMB', 'RAAT'];
  shortcutFilteredOptions: Observable<string[]>;

  constructor(private fb: FormBuilder,
              private technicalActService: TechnicalActService) {
  }

  ngOnInit() {
    this.typeFilteredOptions = this.typeControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterType(value))
    );
    this.shortcutFilteredOptions = this.shortcutControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterShortcut(value))
    );
    this.technicalActService.getAll().subscribe( (techTab) => {
      for (const t of techTab) {
        if (t.name !== this.technicalActForm.getRawValue().name) {
          this.prestationCodes.push(t.name);
        }
      }
    });
    this.initialize();
  }

  private _filterType(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.typeOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  private _filterShortcut(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.shortcutOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  notSingle(): boolean {
    if (this.technicalActForm.getRawValue().name.length > 1) {
      return this.prestationCodes.includes(this.technicalActForm.getRawValue().name);
    } else {
      return false;
    }
  }

  initialize() {
    switch (this.data.mode) {
      case TechnicalActFormMode.CREATE:
        this.technicalActForm = this.fb.group({
          name: ['', Validators.required],
          shortcut: '',
          tva: ['', Validators.required],
          schedulerId: ['', Validators.required],
          hasAnalyse: '',
          surfaceType: '',
          productType: '',
          offerCode: '',
          comment: '',
          businessCode: '',
          jobRank: ['', Validators.required],
          jobExpertise: ['', Validators.required],
          description: ['', Validators.required],
          active: ['', Validators.required],
          web: ['', Validators.required],
        });
        break;
      case TechnicalActFormMode.EDIT:
        this.typeControl.setValue(this.data.defaultData.productType);
        this.shortcutControl.setValue(this.data.defaultData.shortcut);
        this.technicalActForm = this.fb.group({
          name: [{value: this.data.defaultData.name, disabled: this.data.disabled}, Validators.required],
          shortcut: [{value: this.data.defaultData.shortcut, disabled: this.data.disabled}, Validators.required],
          tva: [{value: this.getTypeTva(this.data.defaultData.codeTVA), disabled: this.data.disabled}, Validators.required],
          schedulerId: [{value: this.data.defaultData.schedulerId, disabled: this.data.disabled}, Validators.required],
          hasAnalyse: [{value: this.data.defaultData.hasAnalyse, disabled: this.data.disabled}],
          surfaceType: [{value: this.data.defaultData.surfaceType, disabled: this.data.disabled}],
          productType: [{value: this.data.defaultData.productType, disabled: this.data.disabled}, Validators.required],
          offerCode: [{value: this.data.defaultData.offerCode, disabled: this.data.disabled}],
          comment: [{value: this.data.defaultData.comment, disabled: this.data.disabled}],
          businessCode: [{value: this.data.defaultData.businessCode, disabled: this.data.disabled}, Validators.required],
          jobRank: [{value: this.data.defaultData.jobRank, disabled: this.data.disabled}, Validators.required],
          jobExpertise: [{value: this.data.defaultData.jobExpertise, disabled: this.data.disabled}, Validators.required],
          description: [{value: this.data.defaultData.description, disabled: this.data.disabled}, Validators.required],
          active: [{value: this.data.defaultData.active ? "true" : "false", disabled: this.data.disabled}, Validators.required],
          web: [{value: this.data.defaultData.web ? "true" : "false", disabled: this.data.disabled}, Validators.required],
          // tva: [{value: tvaEnum['TVA_' + this.data.typeTVA] TODO ?
        });
        break;
      default:
        this.technicalActForm = this.fb.group({name: '', shortcut: '', tva: '', schedulerId: '', hasAnalyse: ''});
        this.cancelAction.emit();
        break;
    }
  }

  save() {
    const technicalAct = new TechnicalAct(
      this.data.defaultData ? this.data.defaultData.uuid : null,
      this.technicalActForm.getRawValue().name,
      this.shortcutControl.value,
      this.getTypeTva(this.technicalActForm.getRawValue().tva),
      this.getCodeTva(this.technicalActForm.getRawValue().tva),
      this.getProfilTva(this.technicalActForm.getRawValue().tva),
      this.technicalActForm.getRawValue().schedulerId,
      this.technicalActForm.getRawValue().hasAnalyse,
      this.data.defaultData ? this.data.defaultData.created : new Date().getTime(),
      this.technicalActForm.getRawValue().surfaceType,
      this.typeControl.value,
      this.technicalActForm.getRawValue().offerCode,
      this.technicalActForm.getRawValue().comment,
      this.technicalActForm.getRawValue().businessCode,
      this.technicalActForm.getRawValue().jobRank,
      this.technicalActForm.getRawValue().jobExpertise,
      this.technicalActForm.getRawValue().description,
      this.technicalActForm.getRawValue().active,
      this.technicalActForm.getRawValue().web
    );
    switch (this.data.mode) {
      case TechnicalActFormMode.CREATE:
        this.saving = true;
        this.technicalActService.add(technicalAct).subscribe((newUuid) => {
          technicalAct.uuid = newUuid.uuid;
          this.actSaved.emit(technicalAct);
          setTimeout(() => this.saving = false);
        });
        break;
      case TechnicalActFormMode.EDIT:
        this.saving = true;
        this.technicalActService.update(technicalAct).subscribe((updated) => {
          this.actSaved.emit(updated);
          setTimeout(() => this.saving = false);
        });
        break;
      default:
        break;
    }
  }

  isComplete() {
    return (this.typeControl.value && this.typeControl.value.length < 1)
      || (this.shortcutControl.value && this.shortcutControl.value.length < 1)
      || this.notSingle()
      || !(this.technicalActForm.valid);
  }

  getProfilTva(tva) {
    switch (tvaEnum[tvaEnum[tva]]) {
      case tvaEnum.TVA_0:
        return '2200 - Collectée encaissements exonéré de TVA';
      case tvaEnum.TVA_10:
        return '2202 - Collectée encaissements interméd. réduit';
      case tvaEnum.TVA_20:
        return '2201 - Collectée encaissements taux normal';
      default :
        return '2201 - Collectée encaissements taux normal';
    }
  }

  getTypeTva(tva) {
    switch (tvaEnum[tvaEnum[tva]]) {
      case tvaEnum.TVA_0:
        return 0;
      case tvaEnum.TVA_10:
        return 10;
      case tvaEnum.TVA_20:
        return 20;
      default:
        return 1;
    }
  }

  getCodeTva(tva) {
    switch (tvaEnum[tvaEnum[tva]]) {
      case tvaEnum.TVA_0:
        return '2200';
      case tvaEnum.TVA_10:
        return '44574860';
      case tvaEnum.TVA_20:
        return '44574800';
    }
  }


  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }
}

export interface TechnicalActFormData {
  mode: TechnicalActFormMode | string;  // Create mode
  disabled?: boolean;                   // Disable fields
  deletable?: boolean;                  // Show delete button
  defaultData?: ITechnicalAct;          // Default data
}

export enum TechnicalActFormMode {
  CREATE = 'create',
  EDIT = 'edit',
}
