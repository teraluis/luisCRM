import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Order} from '../../../services/backend/orders.service';
import {MatSelect} from '@angular/material';
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {AllEstateTypes, Annex, Estate, EstatesService, Locality, Premises
} from '../../../services/backend/estates.service';
import {Address} from '../../../services/backend/addresses.service';
import {MatTableDataSource} from '@angular/material/table';
import {ConfirmationComponent} from '../../confirmation/confirmation.component';
import {MatDialog} from '@angular/material/dialog';
import {InfoService} from '../../../services/front/info.service';
import {forkJoin} from 'rxjs';
import {SelectionModel} from '@angular/cdk/collections';
import {OrderPrestationData, OrderPrestationDialogComponent, PrestationsWithTableLine
} from '../order-prestation-dialog/order-prestation-dialog.component';
import {AddressUtils} from '../../utils/address-utils';
import {EstateWithPrestations, Prestation, PrestationEstateType, PrestationsService
} from '../../../services/backend/prestations.service';
import {OrderStatus} from '../../utils/order-utils';
import {TechnicalAct, TechnicalActService} from '../../../services/backend/technical-act.service';
import {EstateUtils} from '../../utils/estate-utils';
import {EstateSearchDialogComponent} from '../../estate-search-dialog/estate-search-dialog.component';
import {EstateCreateData} from '../../estate-create/estate-create.component';
import {EstateCreateDialogComponent} from '../../estate-create/estate-create-dialog/estate-create-dialog.component';
import {ElementToEdit, EstateEditData, OrderSelection} from '../../estate-edit/estate-edit.component';
import {EstateEditDialogComponent, EstateEditReturnValue
} from '../../estate-edit/estate-edit-dialog/estate-edit-dialog.component';
import {PlusActionData} from '../../plus-button/plus-button.component';
import {EstablishmentUtils} from "../../utils/establishment-utils";

@Component({
  selector: 'app-order-estate',
  templateUrl: './order-estate.component.html',
  styleUrls: ['./order-estate.component.scss']
})
export class OrderEstateComponent implements OnInit, TableSearchListInterface {

  @Input() status: OrderStatus;
  @Input() order: Order;
  @Input() update: EventEmitter<void>;

  @Input() set modification(value: boolean) {
    this.setAddPrestationAction();
    this._modification = value;
  }

  get modification(): boolean {
    return this._modification;
  }

  @Input() modificationEvent: EventEmitter<void>;
  @Input() disabled: boolean;

  @Output() updateOrder = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any>();
  @Output() getActionButton: EventEmitter<PlusActionData[]> = new EventEmitter<PlusActionData[]>();

  @ViewChild('other') otherField: ElementRef;
  @ViewChild('matSelect') selectField: MatSelect;

  accountName: string;
  selectedEstates: SelectionModel<ListEstateTableLine>;
  estateWithPrestations: EstateWithPrestations[] = [];
  singleLocalities: LocalityWithPrestation[] = [];
  singlePremises: PremisesWithPrestation[] = [];
  singleAnnexes: AnnexWithPrestation[] = [];
  technicalActNames: string[];
  allTypes: AllEstateTypes;
  presentTypes: string[] = [];
  loading: boolean;
  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options = [TableOption.REORDER, TableOption.SELECT, TableOption.EDIT, TableOption.DELETE, TableOption.OPEN_DIALOG];
  displayedColumns = ['reference', 'type', 'address', 'locality', 'prestations', 'number', 'floor'];
  hiddenColumns = ['totalPrice'];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Référence', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Typologie', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Adresse', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Localité', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Prestations', filterType: FilterType.COMBO, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'N° logement', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100},
    {name: this.displayedColumns[6], title: 'Étage', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100},
    {name: this.hiddenColumns[0], title: 'Total', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100},
  ];
  maxRows = 20;
  dataSourceChange = new EventEmitter<any>();

  actionButton: PlusActionData[] = [];

  private _modification: boolean;
  private dataSource: MatTableDataSource<ListEstateTableLine>;

  constructor(private estatesService: EstatesService,
              private prestationsService: PrestationsService,
              private technicalActService: TechnicalActService,
              private infoService: InfoService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loading = true;
    forkJoin(
      this.estatesService.listAllTypes(),
      this.technicalActService.getAll()
    ).subscribe(([types, acts]: [AllEstateTypes, TechnicalAct[]]) => {
      this.allTypes = types;
      this.technicalActNames = acts.map(act => act.shortcut);
      this.loading = false;
    });
    this.update.subscribe(() => this.setFilterData(''));
    this.modificationEvent.subscribe(() => this.setFilterData(''));
    this.initActionButton();
  }

  checkStatus() {
    if ((this.disabled || (this.status > OrderStatus.RECEIVED && !this.modification))) {
      if (this.options.indexOf(TableOption.SELECT) > -1) {
        this.options.splice(this.options.indexOf(TableOption.SELECT), 1);
      }
    }
    this.actionButton[0].disabled = this.disabled || (this.status > OrderStatus.RECEIVED && !this.modification);
    this.actionButton[0].hidden = this.disabled || (this.status > OrderStatus.RECEIVED && !this.modification);

    this.initActionButton();
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: any) {
    this.isLoading.emit(true);
    this.prestationsService.getEstateWithPrestationsFromOrder(this.order.uuid).subscribe((estateWithPrestations) => {
      this.estateWithPrestations = estateWithPrestations;
      this.checkStatus();
      this.dataSource = new MatTableDataSource<ListEstateTableLine>(this.buildListEstatesTableLine());
      this.isEmpty = this.dataSource.data.length === 0;
      this.setAddPrestationAction();
      this.dataSourceChange.emit({dataSource: this.dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildListEstatesTableLine(): ListEstateTableLine[] {
    let i = 1;
    const result: ListEstateTableLine[] = [];
    this.singleLocalities = [];
    this.singlePremises = [];
    this.singleAnnexes = [];
    if (this.estateWithPrestations && this.estateWithPrestations.length > 0) {
      this.estateWithPrestations.forEach((estateWithPrestation) => {
        if (estateWithPrestation.prestations && estateWithPrestation.prestations.length > 0) {
          estateWithPrestation.prestations.forEach((prestation) => {
            switch (prestation.estateType) {
              case PrestationEstateType.ANNEX:
                if (!this.singleAnnexes.map(s => s.annex.id).includes(prestation.targetId)) {
                  estateWithPrestation.estate.localities.forEach((locality) => {
                    const annex: Annex = locality.annexes.find(a => a.id === prestation.targetId);
                    if (!!annex) {
                      this.singleAnnexes.push({
                        annex: annex,
                        address: locality.addresses[0],
                        prestations: [prestation],
                        estateInterventionStatus: estateWithPrestation.estateInterventionStatus,
                        interventionId: estateWithPrestation.interventionId
                      });
                    }
                  });
                } else {
                  this.singleAnnexes[this.singleAnnexes.findIndex(s => s.annex.id === prestation.targetId)].prestations.push(prestation);
                }
                break;
              case PrestationEstateType.PREMISES:
                if (!this.singlePremises.map(s => s.premises.id).includes(prestation.targetId)) {
                  estateWithPrestation.estate.localities.forEach((locality) => {
                    const premises: Premises = locality.premises.find(p => p.id === prestation.targetId);
                    if (!!premises) {
                      this.singlePremises.push({
                        premises: premises,
                        address: locality.addresses[0],
                        prestations: [prestation],
                        estateInterventionStatus: estateWithPrestation.estateInterventionStatus,
                        interventionId: estateWithPrestation.interventionId
                      });
                    }
                  });
                } else {
                  this.singlePremises[this.singlePremises.findIndex(s => s.premises.id === prestation.targetId)].prestations.push(prestation);
                }
                break;
              default:
                break;
            }
          });
        }
      });
      this.singlePremises.forEach((pwp) => {
        const type = pwp.premises.customPremisesType ? pwp.premises.customPremisesType : (pwp.premises.premisesType ? pwp.premises.premisesType.type : '');
        result.push({
          id: pwp.prestations[0].estate,
          targetId: pwp.premises.id,
          estateType: PrestationEstateType.PREMISES,
          reference: pwp.premises.premisesReference,
          type: type,
          address: AddressUtils.getName(pwp.address),
          locality: AddressUtils.getLocality(pwp.address),
          prestations: pwp.prestations.filter(p => p.technicalAct).map(p => p.technicalAct.shortcut).sort().join(', '),
          totalPrice: '',
          number: pwp.premises.number,
          floor: pwp.premises.floor,
          lineIcon: {icon: 'house', tooltip: 'Local'},
          actionDisabled: this.disabled,
          deletable: this.modification && pwp.estateInterventionStatus !== 'done',
          keepActiveOpenDialog: true,
          position: i,
          estateInterventionStatus: pwp.estateInterventionStatus,
          interventionId: pwp.interventionId
        });
        i++;
        if (!this.presentTypes.includes(type)) {
          this.presentTypes.push(type);
        }
      });
      this.singleAnnexes.forEach((awp) => {
        const type = awp.annex.customAnnexType ? awp.annex.customAnnexType : (awp.annex.annexType ? awp.annex.annexType.type : '');
        result.push({
          id: awp.prestations[0].estate,
          targetId: awp.annex.id,
          estateType: PrestationEstateType.ANNEX,
          reference: awp.annex.annexReference,
          type: type,
          address: AddressUtils.getName(awp.address),
          locality: AddressUtils.getLocality(awp.address),
          prestations: awp.prestations.filter(p => p.technicalAct).map(p => p.technicalAct.shortcut).sort().join(', '),
          totalPrice: '',
          number: '',
          floor: awp.annex.floor,
          lineIcon: {icon: 'house_siding', tooltip: 'Annexe'},
          actionDisabled: this.disabled,
          deletable: this.modification && awp.estateInterventionStatus !== 'done',
          keepActiveOpenDialog: true,
          position: i,
          estateInterventionStatus: awp.estateInterventionStatus,
          interventionId: awp.interventionId
        });
        i++;
        if (!this.presentTypes.includes(type)) {
          this.presentTypes.push(type);
        }
      });
    }
    return result;
  }

  createEstate() {
    const dialogSelect = this.dialog.open(EstateSearchDialogComponent, {
      width: '75%',
      maxHeight: '90vh',
      panelClass: 'dialog-transparent'
    });
    dialogSelect.afterClosed().subscribe((selectedEstate: Estate) => {
      // If selectedEstate is an EstateUtils.emptyEstate, create a new one
      if (selectedEstate && !selectedEstate.id) {
        const data: EstateCreateData = {
          defaultEstablishment: this.order.establishment ? EstablishmentUtils.buildEstablishment(this.order.establishment.establishment) : null,
          defaultAccount: this.order.establishment.account, // TODO manage individuals, do not get account from establishment
          allTypes: this.allTypes
        };
        const dialogCreate = this.dialog.open(EstateCreateDialogComponent, {
          data: data,
          width: '75%'
        });
        dialogCreate.afterClosed().subscribe((newEstate: Estate) => {
          if (newEstate && newEstate.id) {
            this.openEstate(newEstate);
          }
        });
        // If selectedEstate is an existing estate
      } else if (selectedEstate && selectedEstate.id) {
        this.openEstate(selectedEstate);
      }
      // Nothing to do if the dialog is left
    });
  }

  openEstate(estate: Estate) {
    // Filtering singleX elements for current estate is very important for setOrderSelection()
    const premisesIds: string[] = [].concat(...estate.localities.map(l => l.premises.map(p => p.id)));
    const annexIds: string[] = [].concat(...estate.localities.map(l => l.annexes.map(a => a.id)));
    const orderSelection: OrderSelection = {
      premises: this.singlePremises.filter(p => premisesIds.includes(p.premises.id)).map(s => s.premises),
      annexes: this.singleAnnexes.filter(a => annexIds.includes(a.annex.id)).map(s => s.annex)
    };
    const data: EstateEditData = {
      estate: EstateUtils.buildEstate(estate),
      orderSelection: orderSelection,
      disabled: this.disabled || (this.status > OrderStatus.RECEIVED && !this.modification),
      orderMode: true
    };
    const dialogCreate = this.dialog.open(EstateEditDialogComponent, {
      data: data,
      width: '80vw'
    });
    dialogCreate.afterClosed().subscribe((resp: EstateEditReturnValue) => {
      if (resp && resp.selection) {
        this.setOrderSelection(estate, orderSelection, resp.selection, resp.hasChanged);
      }
    });
  }

  setOrderSelection(estate: Estate, oldSelection: OrderSelection, newSelection: OrderSelection, forceReload: boolean) {
    // Add new prestations if present in newSelection and not in oldSelection
    const selectionToAdd: OrderSelection = {
      premises: newSelection.premises.filter(premises => !oldSelection.premises.map(l => l.id).includes(premises.id)),
      annexes: newSelection.annexes.filter(annex => !oldSelection.annexes.map(a => a.id).includes(annex.id))
    };
    // Create new prestations
    const newPrestations: Prestation[] = [];
    if (selectionToAdd.premises) {
      selectionToAdd.premises.forEach((premises) => {
        newPrestations.push({
          uuid: null,
          order: this.order.uuid,
          estate: estate.id,
          targetId: premises.id,
          estateType: PrestationEstateType.PREMISES,
          billLines: []
        });
      });
    }
    if (selectionToAdd.annexes) {
      selectionToAdd.annexes.forEach((annex) => {
        newPrestations.push({
          uuid: null,
          order: this.order.uuid,
          estate: estate.id,
          targetId: annex.id,
          estateType: PrestationEstateType.ANNEX,
          billLines: []
        });
      });
    }
    if (newPrestations.length > 0) {
      this.prestationsService.set([], newPrestations).subscribe((done) => {
        if (!done) {
          console.log('An error occurred when adding new prestation.');
        } else {
          this.infoService.displaySaveSuccess();
        }
        this.updateOrder.emit();
      });
    } else if (forceReload) {
      this.updateOrder.emit();
    }
  }

  clickEvent(actionEvent: ActionEvent) {
    const estateTableLine: ListEstateTableLine = actionEvent.event;
    if (actionEvent.action === ActionType.DELETE) {
      if (estateTableLine.interventionId) {
        const message: string = estateTableLine.estateInterventionStatus === 'ingeo'
          ? 'Êtes-vous sûr de vouloir supprimer l\'intervention associée ? Mise à jour dans Géoconcept potentiellement nécessaire !'
          : 'Êtes-vous sûr de vouloir supprimer l\'intervention associée ? L\'expert a reçu les informations la concernant !';
        const dialogRef = this.dialog.open(ConfirmationComponent, {
          width: '40%',
          data: {
            title: 'Attention',
            text: message
          }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            let tmp: PrestationWithAddress = this.singleAnnexes.find(s => s.annex.id === estateTableLine.targetId);
            tmp = tmp ? tmp : this.singlePremises.find(s => s.premises.id === estateTableLine.targetId);
            tmp = tmp ? tmp : this.singleLocalities.find(s => s.locality.id === estateTableLine.targetId);
            this.prestationsService.deleteFromOrder(tmp.prestations[0].order, estateTableLine.targetId).subscribe((done) => {
              if (!done) {
                console.log('An error occurred when deleting prestations of estate ' + estateTableLine.targetId);
              } else {
                this.infoService.displaySuccess('L\'intervention a été supprimée !');
              }
              this.updateOrder.emit();
            });
          }
        });
      } else {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
          width: '30%',
          data: {
            title: 'Attention',
            text: 'Êtes-vous sûr de vouloir supprimer ce bien et ses prestations associées ?'
          }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            let tmp: PrestationWithAddress = this.singleAnnexes.find(s => s.annex.id === estateTableLine.targetId);
            tmp = tmp ? tmp : this.singlePremises.find(s => s.premises.id === estateTableLine.targetId);
            tmp = tmp ? tmp : this.singleLocalities.find(s => s.locality.id === estateTableLine.targetId);
            const prestations: string[] = tmp.prestations.map(p => p.uuid);
            this.prestationsService.set(prestations, []).subscribe((done) => {
              if (!done) {
                console.log('An error occurred when deleting prestations of estate ' + estateTableLine.targetId);
              } else {
                this.infoService.displaySaveSuccess();
              }
              this.updateOrder.emit();
            });
          }
        });
      }
    } else if (actionEvent.action === ActionType.OPEN_DIALOG) {
      this.showPrestations([estateTableLine]);
    } else if (actionEvent.action === ActionType.EDIT) {
      const estate: Estate = this.estateWithPrestations.find(e => e.estate.id === estateTableLine.id).estate;
      let directAccess: ElementToEdit;
      switch (estateTableLine.estateType) {
        case PrestationEstateType.PREMISES:
          directAccess = {
            localityToEdit: EstateUtils.getLocalityFromPremisesId(estate, estateTableLine.targetId),
            premisesToEdit: EstateUtils.getPremisesFromId(estate, estateTableLine.targetId)
          };
          break;
        case PrestationEstateType.ANNEX:
          directAccess = {
            localityToEdit: EstateUtils.getLocalityFromAnnexId(estate, estateTableLine.targetId),
            annexToEdit: EstateUtils.getAnnexFromId(estate, estateTableLine.targetId)
          };
          break;
        default:
          break;
      }
      // Filtering singleX elements for current estate is very important for setOrderSelection()
      const premisesIds: string[] = [].concat(...estate.localities.map(l => l.premises.map(p => p.id)));
      const annexIds: string[] = [].concat(...estate.localities.map(l => l.annexes.map(a => a.id)));
      const orderSelection: OrderSelection = {
        premises: this.singlePremises.filter(p => premisesIds.includes(p.premises.id)).map(s => s.premises),
        annexes: this.singleAnnexes.filter(a => annexIds.includes(a.annex.id)).map(s => s.annex)
      };
      const data: EstateEditData = {
        estate: estate,
        orderSelection: orderSelection,
        directEditAccess: directAccess,
        disabled: this.disabled || this.status > OrderStatus.RECEIVED,
        orderMode: true
      };
      const dialogLocality = this.dialog.open(EstateEditDialogComponent, {
        data: data,
        width: '80vw'
      });
      dialogLocality.afterClosed().subscribe((resp: EstateEditReturnValue) => {
        if (resp && resp.selection) {
          this.setOrderSelection(estate, orderSelection, resp.selection, resp.hasChanged);
        } else if (resp && resp.hasChanged) {
          this.updateOrder.emit();
        }
      });
    }
  }

  showPrestations(estates: ListEstateTableLine[] = null) {
    const prestationsWithTableLines: PrestationsWithTableLine[] = [];
    const selectedLines = this.selectedEstates && this.selectedEstates.selected && this.selectedEstates.selected.length ? this.selectedEstates.selected : this.dataSource.data;
    estates = estates || selectedLines;
    estates.forEach((estate) => {
      let tmp: PrestationWithAddress = this.singleAnnexes.find(s => s.annex.id === estate.targetId);
      tmp = tmp ? tmp : this.singlePremises.find(s => s.premises.id === estate.targetId);
      tmp = tmp ? tmp : this.singleLocalities.find(s => s.locality.id === estate.targetId);
      prestationsWithTableLines.push({
        prestations: tmp.prestations,
        estateTableLine: estate
      });
    });
    const interventionDone: boolean = estates.length === 1 && estates[0].estateInterventionStatus === 'done';
    const data: OrderPrestationData = {
      order: this.order,
      prestationsWithTableLine: prestationsWithTableLines,
      market: this.order.market ? this.order.market.uuid : null,
      disabled: this.disabled || (this.status > OrderStatus.RECEIVED && !this.modification) || interventionDone
    };
    const dialogRef = this.dialog.open(OrderPrestationDialogComponent, {
      data: data,
      width: '80%',
      maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe((hasChanged) => {
      if (hasChanged) {
        this.updateOrder.emit();
        this.infoService.displaySaveSuccess();
      }
    });
  }

  getComboList = () => {
    return {prestations: this.technicalActNames, type: this.presentTypes};
  }

  setSelectedEstate(evt) {
    this.selectedEstates = evt;
    this.setAddPrestationAction();
  }

  private initActionButton(sendEvent = true) {
    this.actionButton = [
      {
        label: 'Ajouter un bien',
        icon: 'add',
        function: () => this.createEstate()
      }
    ];

    if (sendEvent) {
      this.getActionButton.emit(this.actionButton);
    }
  }

  private setAddPrestationAction() {
    this.initActionButton(false);
    if (!this.isEmpty && !this.disabled) {
      this.actionButton.push({
        label: 'Préciser les prestations sur les biens séléctionnés',
        icon: 'add',
        disabled: !this.modification,
        function: () => this.showPrestations()
      });
    }
    this.getActionButton.emit(this.actionButton);
  }
}

export interface ListEstateTableLine extends DeletableTableLine {
  targetId: string;
  estateType: PrestationEstateType;
  reference: string;
  type: string;
  address: string;
  locality: string;
  prestations: string;
  totalPrice: string;
  number: string;
  floor: string;
  estateInterventionStatus: string;
  interventionId?: string;
}

export interface PrestationWithAddress {
  address: Address;
  prestations: Prestation[];
  estateInterventionStatus: string;
  interventionId?: string;
}

export interface LocalityWithPrestation extends PrestationWithAddress {
  locality: Locality;
  estateTypeThatShouldBeLocalityType: string;
}

export interface PremisesWithPrestation extends PrestationWithAddress {
  premises: Premises;
}

export interface AnnexWithPrestation extends PrestationWithAddress {
  annex: Annex;
}
