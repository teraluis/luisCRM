import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {Annex, EstatesService, IdType} from "../../services/backend/estates.service";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {MatSelectChange} from "@angular/material/select";
import {EstateUtils} from "../utils/estate-utils";

@Component({
  selector: 'app-estate-form-annex',
  templateUrl: './estate-form-annex.component.html',
  styleUrls: ['./estate-form-annex.component.scss']
})
export class EstateFormAnnexComponent implements OnInit {

  @Input() data: AnnexFormData;

  @Output() annexSaved = new EventEmitter<Annex>();
  @Output() removeAnnex = new EventEmitter<Annex>();
  @Output() cancelAction = new EventEmitter<void>();

  currentData: Annex;
  types: IdType[] = [];
  typeList: string[];
  typeId: string;
  unknowType: boolean;
  loading: boolean;
  saving = false;
  mode = {
    CREATE: AnnexFormMode.CREATE,
    EDIT: AnnexFormMode.EDIT
  };

  constructor(private estatesService: EstatesService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    if (this.data.annexTypes) {
      this.types = this.data.annexTypes;
      this.initialize();
    } else {
      this.loading = true;
      this.estatesService.listAnnexTypes().subscribe((types) => {
        this.types = types;
        this.initialize();
        this.loading = false;
      });
    }
  }

  initialize() {
    switch (this.data.mode) {
      case AnnexFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? EstateUtils.duplicateAnnex(this.data.defaultData)
          : EstateUtils.buildAnnex();
        break;
      case AnnexFormMode.EDIT:
        this.currentData = EstateUtils.buildAnnex(this.data.defaultData);
        break;
      default:
        this.currentData = EstateUtils.buildAnnex();
        this.cancelAction.emit();
        break;
    }
    this.typeList = this.types.map(t => t.id);
    this.typeId = this.currentData.annexType ? this.currentData.annexType.id : '';
  }

  isComplete() {
    switch (this.data.mode) {
      case AnnexFormMode.CREATE:
        return this.isAnnexComplete();
      case AnnexFormMode.EDIT:
        return this.isAnnexChanged();
      default:
        return false;
    }
  }

  save() {
    switch (this.data.mode) {
      case AnnexFormMode.CREATE:
        if (!this.currentData.id) {
          this.addAnnex();
        } else {
          this.updateAnnex();
        }
        break;
      case AnnexFormMode.EDIT:
        this.updateAnnex();
        break;
      default:
        break;
    }
  }

  isAnnexChanged() {
    return ((this.currentData.annexType && !this.data.defaultData.annexType) || (!this.currentData.annexType && this.data.defaultData.annexType) || (this.currentData.annexType && this.data.defaultData.annexType && this.currentData.annexType.id !== this.data.defaultData.annexType.id))
      || this.currentData.area !== this.data.defaultData.area || this.currentData.customAnnexType !== this.data.defaultData.customAnnexType
      || this.currentData.floor !== this.data.defaultData.floor || this.currentData.isCommonArea !== this.data.defaultData.isCommonArea
      || this.currentData.annexReference !== this.data.defaultData.annexReference;
  }

  isAnnexComplete() {
    return this.unknowType !== undefined && this.currentData.isCommonArea !== undefined;
  }

  delete(annex: Annex) {
    const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    deleteDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeAnnex.emit(annex);
      }
    });
  }

  changeSelectionState(ev: MatSelectChange) {
    const estateTypeId = ev.value;
    this.unknowType = estateTypeId === 'unknow';
    this.currentData.annexType = this.types.find((value) => value.id === estateTypeId);
  }

  getName(id: string) {
    if (id === 'unknow') {
      return 'Inconnu';
    } else {
      const type = this.types.filter((com) => com.id === id)[0];
      return type ? type.type : '';
    }
  }

  updateAnnex() {
    this.saving = true;
    this.estatesService.updateAnnex(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while updating premises " + this.currentData.id);
      } else {
        this.currentData = EstateUtils.buildAnnex(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  addAnnex() {
    this.saving = true;
    this.estatesService.addAnnex(this.currentData).subscribe((updated) => {
      if (!updated) {
        console.log("An error occurred while adding new premises");
      } else {
        this.currentData = EstateUtils.buildAnnex(updated);
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = EstateUtils.buildAnnex(this.currentData);
    this.annexSaved.emit(EstateUtils.buildAnnex(this.currentData));
  }
}

export interface AnnexFormData {
  mode: AnnexFormMode | string; // Display mode
  disabled?: boolean;             // Disable fields
  deletable?: boolean;            // Show delete button
  inStep?: boolean;               // If displayed in another stepper
  defaultData?: Annex;            // Default data
  annexTypes?: IdType[];          // Give to avoid loading
}

export enum AnnexFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
