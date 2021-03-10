import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {AllEstateTypes, Annex, Estate, EstatesService, IdType, Locality, Premises
} from "../../services/backend/estates.service";
import {EstateTypeDisplay, EstateUtils} from "../utils/estate-utils";
import {People} from "../../services/backend/people.service";
import {MatSelectChange} from "@angular/material/select";
import {AddressUtils} from "../utils/address-utils";
import {PeopleUtils} from "../utils/people-utils";
import {InfoService} from "../../services/front/info.service";
import {PremisesFormData, PremisesFormMode} from "../estate-form-premises/estate-form-premises.component";
import {MatDialog} from "@angular/material/dialog";
import {EstateFormPremisesDialogComponent} from "../estate-form-premises/estate-form-premises-dialog/estate-form-premises-dialog.component";
import {AnnexFormData, AnnexFormMode} from "../estate-form-annex/estate-form-annex.component";
import {EstateFormAnnexDialogComponent} from "../estate-form-annex/estate-form-annex-dialog/estate-form-annex-dialog.component";
import {LocalityFormData, LocalityFormMode} from "../estate-form-locality/estate-form-locality.component";
import {EstateFormLocalityDialogComponent} from "../estate-form-locality/estate-form-locality-dialog/estate-form-locality-dialog.component";

@Component({
  selector: 'app-estate-edit',
  templateUrl: './estate-edit.component.html',
  styleUrls: ['./estate-edit.component.scss']
})
export class EstateEditComponent implements OnInit {

  @Input() data: EstateEditData;

  @Output() selection = new EventEmitter<OrderSelection>();
  @Output() hasChanged = new EventEmitter<void>();

  loading: boolean;
  saving = false;
  estate: Estate;
  selectedPremises: Premises[] = [];
  selectedAnnexes: Annex[] = [];
  localityToEdit: Locality;
  premisesToEdit: Premises;
  annexToEdit: Annex;
  allTypes: AllEstateTypes;
  estateTypes: IdType[];
  estateTypeIds: string[];
  estateTypeId: string;
  ownerName: string;
  showEditEstate = false;
  tabIndex = 0;
  HOUSE_TYPE = EstateTypeDisplay.HOUSE;
  estateTypeDisplay: EstateTypeDisplay;

  constructor(private estatesService: EstatesService,
              private infoService: InfoService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loading = true;
    this.estate = EstateUtils.buildEstate(this.data.estate);
    this.sortEstate();
    this.ownerName = EstateUtils.getOwnerName(this.estate);
    this.estateTypeDisplay = EstateUtils.getTypeDisplay(this.estate);
    if (!!this.data.directEditAccess) {
      this.localityToEdit = this.data.directEditAccess.localityToEdit;
      if (this.data.directEditAccess.premisesToEdit) {
        this.premisesToEdit = this.data.directEditAccess.premisesToEdit;
        this.tabIndex = 2;
      } else if (this.data.directEditAccess.annexToEdit) {
        this.annexToEdit = this.data.directEditAccess.annexToEdit;
        this.tabIndex = 3;
      } else {
        this.tabIndex = 1;
      }
    } else {
      this.localityToEdit = this.estate.localities[0];
    }
    this.setOrderSelectionThenFilter();
    this.estatesService.listAllTypes().subscribe((types: AllEstateTypes) => {
      this.allTypes = types;
      this.estateTypes = types.estate;
      this.estateTypeIds = types.estate.map(t => t.id);
      this.estateTypeId = this.estate.estateType.id;
      this.loading = false;
    });
  }

  setOrderSelectionThenFilter() {
    if (!!this.data.orderSelection) {
      const premisesIds: string[] = [].concat(...this.data.estate.localities.map(l => l.premises.map(p => p.id)));
      const annexIds: string[] = [].concat(...this.data.estate.localities.map(l => l.annexes.map(a => a.id)));
      const defaultSelection: OrderSelection = {
        premises: this.data.orderSelection.premises.filter(s => premisesIds.includes(s.id)),
        annexes: this.data.orderSelection.annexes.filter(s => annexIds.includes(s.id))
      };
      this.selectedPremises.push(...defaultSelection.premises);
      this.selectedAnnexes.push(...defaultSelection.annexes);
    }
    this.filterDeletedElement();
  }

  filterDeletedElement() {
    // Display deleted element only if data.orderMode is active and the element is part of data.orderSelection
    this.estate.localities = this.estate.localities.filter(l => !l.deleted || (this.data.orderMode
      && (l.premises.map(p => p.id).map(t => this.selectedPremises.map(p => p.id).includes(t)).includes(true)
        || l.annexes.map(a => a.id).map(t => this.selectedAnnexes.map(a => a.id).includes(t)).includes(true))));
    this.estate.localities.forEach(l => {
      l.premises = l.premises.filter(p => (!p.deleted && !l.deleted) || (this.data.orderMode && this.selectedPremises.map(s => s.id).includes(p.id)));
      l.annexes = l.annexes.filter(a => (!a.deleted && !l.deleted) || (this.data.orderMode && this.selectedAnnexes.map(s => s.id).includes(a.id)));
    });
  }

  sortEstate() {
    this.estate.localities.sort((a, b) => b.creationDate - a.creationDate);
    this.estate.localities.forEach((locality) => {
      locality.annexes.sort((a, b) => EstateUtils.sortByFloor(a, b));
      locality.premises.sort((a, b) => EstateUtils.sortByFloor(a, b));
    });
  }

  updateLocality(locality: Locality) {
    this.hasChanged.emit();
    if (!this.localityToEdit) {
      this.localityToEdit = locality;
      this.estate.localities.push(locality);
      this.save();
    } else {
      const index = this.estate.localities.findIndex(l => l.id === this.localityToEdit.id);
      this.estate.localities[index] = locality;
      this.infoService.displaySaveSuccess();
      this.sortEstate();
    }
  }

  updatePremises(premises: Premises) {
    this.hasChanged.emit();
    const index = this.estate.localities.findIndex(l => l.id === this.localityToEdit.id);
    if (!this.premisesToEdit) {
      this.premisesToEdit = premises;
      this.estate.localities[index].premises.push(premises);
      this.saveLocality(index);
    } else {
      const index2 = this.estate.localities[index].premises.findIndex(p => p.id === premises.id);
      this.estate.localities[index].premises[index2] = premises;
      this.infoService.displaySaveSuccess();
      this.sortEstate();
    }
  }

  updateAnnex(annex: Annex) {
    this.hasChanged.emit();
    const index = this.estate.localities.findIndex(l => l.id === this.localityToEdit.id);
    if (!this.annexToEdit) {
      this.annexToEdit = annex;
      this.estate.localities[index].annexes.push(annex);
      this.saveLocality(index);
    } else {
      const index2 = this.estate.localities[index].annexes.findIndex(a => a.id === annex.id);
      this.estate.localities[index].annexes[index2] = annex;
      this.infoService.displaySaveSuccess();
      this.sortEstate();
    }
  }

  removeLocality(locality: Locality) {
    if (locality.premises.map(p => p.id).map(t => this.selectedPremises.map(p => p.id).includes(t)).includes(true)
      || locality.annexes.map(a => a.id).map(t => this.selectedAnnexes.map(a => a.id).includes(t)).includes(true)) {
      this.selectedPremises = this.selectedPremises.filter(s => !locality.premises.map(p => p.id).includes(s.id));
      this.selectedAnnexes = this.selectedAnnexes.filter(s => !locality.annexes.map(a => a.id).includes(s.id));
    }
    this.saving = true;
    this.estatesService.deleteLocality(locality.id).subscribe(done => {
      if (done) {
        this.estate.localities[this.estate.localities.findIndex(l => l.id === locality.id)].deleted = true;
        this.infoService.displaySaveSuccess();
      }
      this.filterDeletedElement();
      this.sortEstate();
      this.tabIndex = 0;
      setTimeout(() => this.saving = false);
    });
  }

  removePremises(premises: Premises) {
    if (!!this.selectedPremises.find(p => p.id === premises.id)) {
      this.selectedPremises = this.selectedPremises.filter(p => p.id !== premises.id);
    }
    this.saving = true;
    this.estatesService.deletePremises(premises.id).subscribe(done => {
      if (done) {
        const index = this.estate.localities.findIndex(l => l.id === this.localityToEdit.id);
        this.estate.localities[index].premises[this.estate.localities[index].premises.findIndex(p => p.id === premises.id)].deleted = true;
        this.infoService.displaySaveSuccess();
      }
      this.filterDeletedElement();
      this.sortEstate();
      this.tabIndex = 0;
      setTimeout(() => this.saving = false);
    });
  }

  removeAnnex(annex: Annex) {
    if (!!this.selectedAnnexes.find(a => a.id === annex.id)) {
      this.selectedAnnexes = this.selectedAnnexes.filter(a => a.id !== annex.id);
    }
    this.saving = true;
    this.estatesService.deleteAnnex(annex.id).subscribe(done => {
      if (done) {
        const index = this.estate.localities.findIndex(l => l.id === this.localityToEdit.id);
        this.estate.localities[index].annexes[this.estate.localities[index].annexes.findIndex(p => p.id === annex.id)].deleted = true;
        this.infoService.displaySaveSuccess();
      }
      this.filterDeletedElement();
      this.sortEstate();
      this.tabIndex = 0;
      setTimeout(() => this.saving = false);
    });
  }

  getEstateIcon(estate: Estate) {
    return EstateUtils.getEstateIcon(estate);
  }

  getPremisesLabel(estate: Estate, plural?: boolean) {
    return EstateUtils.getPremisesLabel(estate, plural);
  }

  getLocalityAddress(locality: Locality) {
    return locality ? AddressUtils.getFullName(locality.addresses[0]) : '';
  }

  getContactName(contact: People) {
    return PeopleUtils.getName(contact);
  }

  selectPremises(premises: Premises) {
    if (this.selectedPremises.map(p => p.id).includes(premises.id)) {
      this.selectedPremises = this.selectedPremises.filter(p => p.id !== premises.id);
    } else {
      this.selectedPremises.push(premises);
    }
  }

  selectAnnex(annex: Annex) {
    if (this.selectedAnnexes.map(a => a.id).includes(annex.id)) {
      this.selectedAnnexes = this.selectedAnnexes.filter(a => a.id !== annex.id);
    } else {
      this.selectedAnnexes.push(annex);
    }
  }

  isSelectedLocality(locality: Locality) {
    const premises: string[] = locality.premises.map(p => p.id);
    const annexes: string[] = locality.annexes.map(a => a.id);
    return !!this.selectedPremises.find(p => premises.includes(p.id)) || !!this.selectedAnnexes.find(a => annexes.includes(a.id));
  }

  isSelectedPremises(premises: Premises) {
    return !!this.selectedPremises.find(p => p.id === premises.id);
  }

  isSelectedAnnex(annex: Annex) {
    return !!this.selectedAnnexes.find(a => a.id === annex.id);
  }

  changeEstateType(ev: MatSelectChange) {
    this.estate.estateType = this.estateTypes.find((value) => value.id === ev.value);
  }

  getTypeName(id: string) {
    const type = this.estateTypes.filter((value) => value.id === id)[0];
    return type ? type.type : '';
  }

  isAllPremisesSelected(locality: Locality) {
    let result = !!locality.premises && locality.premises.length > 0;
    locality.premises.forEach(p => {
      if (result && !this.selectedPremises.map(s => s.id).includes(p.id)) {
        result = false;
      }
    });
    return result;
  }

  isAllAnnexesSelected(locality: Locality) {
    let result = !!locality.annexes && locality.annexes.length > 0;
    locality.annexes.forEach(a => {
      if (result && !this.selectedAnnexes.map(s => s.id).includes(a.id)) {
        result = false;
      }
    });
    return result;
  }

  selectAllPremises(locality: Locality) {
    this.unselectAllPremises(locality);
    const defaultIds: string[] = this.data.orderSelection ? this.data.orderSelection.premises.map(p => p.id) : [];
    locality.premises.filter(p => !defaultIds.includes(p.id)).forEach(p => this.selectedPremises.push(p));
  }

  selectAllAnnexes(locality: Locality) {
    this.unselectAllAnnexes(locality);
    const defaultIds: string[] = this.data.orderSelection ? this.data.orderSelection.annexes.map(a => a.id) : [];
    locality.annexes.filter(a => !defaultIds.includes(a.id)).forEach(a => this.selectedAnnexes.push(a));
  }

  unselectAllPremises(locality: Locality) {
    const defaultIds: string[] = this.data.orderSelection ? this.data.orderSelection.premises.map(p => p.id) : [];
    const ids: string[] = locality.premises.filter(p => !defaultIds.includes(p.id)).map(p => p.id);
    this.selectedPremises = this.selectedPremises.filter(s => !ids.includes(s.id));
  }

  unselectAllAnnexes(locality: Locality) {
    const defaultIds: string[] = this.data.orderSelection ? this.data.orderSelection.annexes.map(a => a.id) : [];
    const ids: string[] = locality.annexes.filter(a => !defaultIds.includes(a.id)).map(a => a.id);
    this.selectedAnnexes = this.selectedAnnexes.filter(s => !ids.includes(s.id));
  }

  editLocality(locality: Locality) {
    this.localityToEdit = locality;
    this.accessToLocality(locality);
  }

  editPremises(locality: Locality, premises: Premises) {
    this.localityToEdit = locality;
    this.premisesToEdit = premises;
    this.accessToPremises(premises);
  }

  editAnnex(locality: Locality, annex: Annex) {
    this.localityToEdit = locality;
    this.annexToEdit = annex;
    this.accessToAnnex(annex);
  }

  createLocality() {
    this.localityToEdit = undefined;
    this.accessToLocality();
  }

  createPremises(locality: Locality) {
    this.localityToEdit = locality;
    this.premisesToEdit = undefined;
    this.accessToPremises();
  }

  createAnnex(locality: Locality) {
    this.localityToEdit = locality;
    this.annexToEdit = undefined;
    this.accessToAnnex();
  }

  accessToLocality(locality?: Locality) {
    if (this.data.dialogMode) {
      setTimeout(() => this.tabIndex = 1);
    } else {
      const data: LocalityFormData = {
        mode: !locality ? LocalityFormMode.CREATE : LocalityFormMode.EDIT,
        defaultData: locality,
        defaultAddress: (locality ? undefined : this.estate.localities[0].addresses[0]),
        disabled: this.data.disabled,
        deletable: !this.data.orderMode && this.estate.localities.length > 1,
        heatingTypes: this.allTypes.heating
      };
      const dialogCreate = this.dialog.open(EstateFormLocalityDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogCreate.afterClosed().subscribe((resp: Locality) => {
        if (resp) {
          this.updateLocality(resp);
        } else if (resp === null) {
          this.removeLocality(locality);
        }
      });
    }
  }

  accessToPremises(premises?: Premises) {
    if (this.data.dialogMode) {
      setTimeout(() => this.tabIndex = 2);
    } else {
      const data: PremisesFormData = {
        mode: !premises ? PremisesFormMode.CREATE : PremisesFormMode.EDIT,
        defaultData: premises,
        disabled: this.data.disabled,
        deletable: !this.data.orderMode,
        types: {heating: this.allTypes.heating, premises: this.allTypes.premises}
      };
      const dialogCreate = this.dialog.open(EstateFormPremisesDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogCreate.afterClosed().subscribe((resp: Premises) => {
        if (resp) {
          this.updatePremises(resp);
        } else if (resp === null) {
          this.removePremises(premises);
        }
      });
    }
  }

  accessToAnnex(annex?: Annex) {
    if (this.data.dialogMode) {
      setTimeout(() => this.tabIndex = 3);
    } else {
      const data: AnnexFormData = {
        mode: !annex ? AnnexFormMode.CREATE : AnnexFormMode.EDIT,
        defaultData: annex,
        disabled: this.data.disabled,
        deletable: !this.data.orderMode,
        annexTypes: this.allTypes.annex
      };
      const dialog = this.dialog.open(EstateFormAnnexDialogComponent, {
        data: data,
        width: '60%'
      });
      dialog.afterClosed().subscribe((resp: Annex) => {
        if (resp) {
          this.updateAnnex(resp);
        } else if (resp === null) {
          this.removeAnnex(annex);
        }
      });
    }
  }

  save() {
    this.saving = true;
    this.showEditEstate = false;
    if (this.data.estate.customEstateType !== this.estate.customEstateType || this.data.estate.estateType.id !== this.estate.estateType.id) {
      this.hasChanged.emit();
    }
    this.estatesService.update(this.estate).subscribe((updated) => {
      if (updated) {
        this.estate = EstateUtils.buildEstate(updated);
        this.data.estate = EstateUtils.buildEstate(updated);
        this.estateTypeDisplay = EstateUtils.getTypeDisplay(this.estate);
        this.infoService.displaySaveSuccess();
        this.filterDeletedElement();
        this.sortEstate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  saveLocality(index: number) {
    this.saving = true;
    this.estatesService.updateLocality(this.estate.localities[index]).subscribe((updated) => {
      if (updated) {
        this.estate.localities[index] = EstateUtils.buildLocality(updated);
        this.infoService.displaySaveSuccess();
        this.filterDeletedElement();
        this.sortEstate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    const selection: OrderSelection = {
      premises: this.selectedPremises,
      annexes: this.selectedAnnexes
    };
    this.selection.emit(selection);
  }

  isDefaultPremises(premises: Premises) {
    return this.data.orderSelection.premises.map(p  => p.id).includes(premises.id);
  }

  isDefaultAnnex(annex: Annex) {
    return this.data.orderSelection.annexes.map(a => a.id).includes(annex.id);
  }

  isAllDefaultPremises(locality: Locality) {
    return locality.premises && !locality.premises.map(p => this.isDefaultPremises(p)).includes(false);
  }

  isAllDefaultAnnex(locality: Locality) {
    return locality.annexes && !locality.annexes.map(a => this.isDefaultAnnex(a)).includes(false);
  }

  isEstateChanged() {
    return this.estate.estateType.id !== this.data.estate.estateType.id || this.estate.estateReference !== this.data.estate.estateReference;
  }
}

/* This component is an edit mode only */
export interface EstateEditData {
  estate: Estate;                   // Estate to display
  disabled: boolean;                // Disable modifications
  orderSelection?: OrderSelection;  // Current selection from order
  directEditAccess?: ElementToEdit; // Direct access to edit page
  orderMode?: boolean;              // Displayed for order
  dialogMode?: boolean;             // Displayed in dialog
}

export interface OrderSelection {
  premises: Premises[];
  annexes: Annex[];
}

export interface ElementToEdit {
  localityToEdit: Locality;
  premisesToEdit?: Premises;
  annexToEdit?: Annex;
}
