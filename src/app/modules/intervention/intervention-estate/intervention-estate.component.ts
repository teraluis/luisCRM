import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {Order} from '../../../services/backend/orders.service';
import {ActionEvent, ActionType, ColumnInformation, FilterType, TableOption, TableSearchListInterface
} from '../../table-search-list/table-search-list.component';
import {AllEstateTypes, Annex, Estate, EstatesService, Locality, Premises
} from '../../../services/backend/estates.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatDialog} from '@angular/material/dialog';
import {forkJoin} from 'rxjs';
import {SelectionModel} from '@angular/cdk/collections';
import {AddressUtils} from '../../utils/address-utils';
import {EstateWithPrestations, PrestationEstateType, PrestationsService
} from '../../../services/backend/prestations.service';
import {TechnicalAct, TechnicalActService} from '../../../services/backend/technical-act.service';
import {EstateUtils} from '../../utils/estate-utils';
import {ElementToEdit, EstateEditData, OrderSelection} from '../../estate-edit/estate-edit.component';
import {EstateEditDialogComponent, EstateEditReturnValue
} from '../../estate-edit/estate-edit-dialog/estate-edit-dialog.component';
import {OrderPrestationData, OrderPrestationDialogComponent, PrestationsWithTableLine
} from "../../order/order-prestation-dialog/order-prestation-dialog.component";
import {AnnexWithPrestation, ListEstateTableLine, LocalityWithPrestation, PremisesWithPrestation, PrestationWithAddress
} from "../../order/order-estate/order-estate.component";

@Component({
  selector: 'app-intervention-estate',
  templateUrl: './intervention-estate.component.html'
})
export class InterventionEstateComponent implements OnInit, TableSearchListInterface {

  @Input() order: Order;
  @Input() interventionId: string;
  @Input() disabled: boolean;

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
  options = [TableOption.REORDER, TableOption.OPEN_DIALOG, TableOption.PREVIEW];
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

  private dataSource: MatTableDataSource<ListEstateTableLine>;

  constructor(private estatesService: EstatesService,
              private prestationsService: PrestationsService,
              private technicalActService: TechnicalActService,
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
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: any) {
    this.isLoading.emit(true);
    this.prestationsService.getEstateWithPrestationsFromIntervention(this.interventionId).subscribe((estateWithPrestations) => {
      this.estateWithPrestations = estateWithPrestations;
      this.dataSource = new MatTableDataSource<ListEstateTableLine>(this.buildListEstatesTableLine());
      this.isEmpty = this.dataSource.data.length === 0;
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
          keepActiveOpenDialog: true,
          position: i,
          estateInterventionStatus: pwp.estateInterventionStatus,
          interventionId: pwp.interventionId,
          deletable: false
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
          keepActiveOpenDialog: true,
          position: i,
          estateInterventionStatus: awp.estateInterventionStatus,
          interventionId: awp.interventionId,
          deletable: false
        });
        i++;
        if (!this.presentTypes.includes(type)) {
          this.presentTypes.push(type);
        }
      });
    }
    return result;
  }

  clickEvent(actionEvent: ActionEvent) {
    const estateTableLine: ListEstateTableLine = actionEvent.event;
    if (actionEvent.action === ActionType.OPEN_DIALOG) {
      this.showPrestations([estateTableLine]);
    } else if (actionEvent.action === ActionType.OPEN_PREVIEW) {
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
        disabled: true,
        orderMode: true
      };
      const dialogLocality = this.dialog.open(EstateEditDialogComponent, {
        data: data,
        width: '80vw'
      });
      dialogLocality.afterClosed().subscribe((resp: EstateEditReturnValue) => {
        if (resp && resp.hasChanged) {
          this.setFilterData('');
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
    const data: OrderPrestationData = {
      order: this.order,
      prestationsWithTableLine: prestationsWithTableLines,
      market: this.order.market ? this.order.market.uuid : null,
      disabled: true
    };
    this.dialog.open(OrderPrestationDialogComponent, {
      data: data,
      width: '80%',
      maxHeight: '90vh'
    });
  }

  getComboList = () => {
    return {prestations: this.technicalActNames, type: this.presentTypes};
  }
}
