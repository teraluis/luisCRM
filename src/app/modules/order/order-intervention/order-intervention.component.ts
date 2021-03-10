import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {InterventionsService, MaterializedIntervention} from '../../../services/backend/interventions.service';
import {FilterType, TableLine, TableSearchListInterface, ColumnInformation, TableOption
} from '../../table-search-list/table-search-list.component';
import {MatTableDataSource} from '@angular/material/table';
import {Prestation, PrestationsService} from '../../../services/backend/prestations.service';
import {EstatesService} from '../../../services/backend/estates.service';
import {InterventionStatus, InterventionUtils} from '../../utils/intervention-utils';
import {AllEstateTypes} from "../../../services/backend/estates.service";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-order-intervention',
  templateUrl: './order-intervention.component.html',
  styleUrls: ['./order-intervention.component.scss']
})
export class OrderInterventionComponent implements OnInit, TableSearchListInterface {

  @Input() orderId: string;
  @Input() update: EventEmitter<void>;
  @Input() modificationEvent: EventEmitter<void>;
  @Input() disabled: boolean;

  types: AllEstateTypes;
  prestations: Prestation[] = [];
  interventions: MaterializedIntervention[];
  selectedInterventions: ListInterventionTableLine[];
  loading: boolean;
  // Datagrid
  isLoading = new EventEmitter<boolean>();
  options = [TableOption.REORDER, TableOption.SELECT];
  displayedColumns = ['interventionNumber', 'estateReference', 'address', 'prestations', 'interventionStatus'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'N° intervention', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100, clickable: !this.disabled, routerLink: () => 'interventions/:id/orders/' + this.orderId},
    {name: this.displayedColumns[1], title: 'Référence bien', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Adresse', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Prestations', filterType: FilterType.COMBO, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Statut', filterType: FilterType.STATUS, filterDisabled: false}
  ];
  maxRows = 20;
  dataSourceChange = new EventEmitter<any>();

  constructor(private estatesService: EstatesService,
              private prestationsService: PrestationsService,
              private interventionsService: InterventionsService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.estatesService.listAllTypes().subscribe((types: AllEstateTypes) => this.types = types);
    this.update.subscribe(() => this.setFilterData(''));
    this.modificationEvent.subscribe(() => this.setFilterData(''));
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: any) {
    this.loading = true;
    this.isLoading.emit(true);
    this.interventionsService.getFromOrder(this.orderId).subscribe((interventions) => {
      this.interventions = interventions;
      this.prestations = [];
      this.interventions.forEach(e => {
        this.prestations = this.prestations.concat(e.asCreated().prestations);
      });
      const dataSource = new MatTableDataSource<ListInterventionTableLine>(this.buildListInterventionTableLine());
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
      this.loading = false;
    });
  }

  buildListInterventionTableLine(): ListInterventionTableLine[] {
    let i = 1;
    const result: ListInterventionTableLine[] = [];
    if (this.interventions && this.interventions.length) {
      this.interventions.forEach((intervention) => {
        const prestations = intervention.asCreated().prestations;
        result.push({
          id: intervention.id,
          estateReference: intervention.asDraft().estateReference,
          address: intervention.asDraft().estateAddress,
          prestations: prestations.map(p => p.technicalAct.shortcut).join(', '),
          interventionNumber: intervention.asDraft().name,
          interventionStatus: this.getStatus(intervention.status),
          actionDisabled: this.disabled,
          position: i
        });
        i++;
      });
    }
    return result;
  }

  isSelectionValid() {
    return this.selectedInterventions && this.selectedInterventions.length > 1 ? !this.selectedInterventions.map(s => this.interventions.find(i => i.id === this.selectedInterventions[0].id).asCreated().prestations[0].estate === this.interventions.find(i => i.id === s.id).asCreated().prestations[0].estate).includes(false) && !this.selectedInterventions.map(i => i.interventionStatus).find(n => n > 1) : false;
  }

  mergeInterventions() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '40%',
      data: {title: 'Attention', text: 'Êtes-vous sûr de vouloir regrouper ces interventions en une seule?'}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const prestations = this.prestations.filter(e => this.selectedInterventions.map(i => i.id).includes(e.mission));
        prestations.forEach((p) => p.mission = this.selectedInterventions[0].id);
        this.prestationsService.set([], prestations).subscribe(done => this.setFilterData(''));
      }
    });
  }

  getStatus(status: string): number {
    return InterventionUtils.getStatusFromLabel(status);
  }

  getStatusList = () => {
    const result = [];
    Object.values(InterventionStatus).forEach(e => {
      if (!isNaN(Number(e))) {
        result.push({name: e, value: this.getStatusName(e)});
      }
    });
    return result;
  }

  getStatusColor = (key: number) => {
    return InterventionUtils.getStatusColor(key);
  }

  getStatusName = (key: number) => {
    return InterventionUtils.getStatusName(key);
  }

  getRouterLink = (columnName: string, row: ListInterventionTableLine) => {
    switch (columnName) {
      case 'interventionNumber':
        return ['/interventions', row.id, 'orders', this.orderId];
      default:
        break;
    }
  }

  getComboList = () => {
    return {prestations: this.prestations.map(p => p.technicalAct.shortcut).sort()};
  }
}

export interface ListInterventionTableLine extends TableLine {
  estateReference: string;
  address: string;
  prestations: string;
  interventionNumber: string;
  interventionStatus: number;
}
