import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import {ColumnInformation, FilterType, TableLine, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {SidePanelType} from "../../../services/front/sidepanel.service";
import {TechnicalAct, TechnicalActService} from "../../../services/backend/technical-act.service";
import {InterventionsService, MaterializedIntervention} from "../../../services/backend/interventions.service";
import {Prestation} from "../../../services/backend/prestations.service";
import {InterventionUtils} from "../../utils/intervention-utils";
import {InterventionStatus} from "../../interventions/new-intervention";

@Component({
  selector: 'app-estate-interventions',
  templateUrl: './estate-interventions.component.html'
})
export class EstateInterventionsComponent implements OnInit, TableSearchListInterface {

  @Input() estateId: string;
  @Input() disabled: boolean;

  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.PREVIEW];
  displayedColumns: string[] = ['name', 'clientName', 'prestations', 'order', 'estateAddress', 'status'];
  hiddenColumns: string[] = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Intervention', filterType: FilterType.TEXT, filterDisabled: false, routerLink: (e) => 'interventions/:id/orders/' + e.orderId, maxWidthPx: 120},
    {name: this.displayedColumns[1], title: 'Client', filterType: FilterType.ACCOUNT, filterDisabled: false, routerLink: () => 'comptes/:clientId', buttonToolTip: true},
    {name: this.displayedColumns[2], title: 'Prestations', filterType: FilterType.COMBO, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Commande', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'orders/:orderId', maxWidthPx: 120},
    {name: this.displayedColumns[4], title: 'Adresse du bien', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Statut', filterType: FilterType.STATUS, filterDisabled: false}
  ];
  maxRows = 10;
  sidePanelType = SidePanelType.INTERVENTION;
  dataSourceChange = new EventEmitter<any>();
  types: TechnicalAct[] = [];

  constructor(protected interventionsService: InterventionsService,
              private technicalActService: TechnicalActService) {
  }

  ngOnInit() {
    this.technicalActService.getAll().subscribe((acts) => {
      this.types = acts;
    });
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.interventionsService.getFromEstate(this.estateId).subscribe((interventions) => {
      const dataSource = new MatTableDataSource<EstateInterventionTableLine>(this.buildInterventionTableLines(interventions));
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  protected buildInterventionTableLines(interventions: MaterializedIntervention[]): EstateInterventionTableLine[] {
    let i = 1;
    return interventions.map((intervention) => {
      const prestations: Prestation[] = intervention.asCreated().prestations;
      const hasError = !prestations || prestations.length === 0;
      const prestasList = [];
      prestations.forEach(p => prestasList.push(p.technicalAct ? p.technicalAct.shortcut : '-'));
      const data: EstateInterventionTableLine = {
        hasError: hasError,
        actionDisabled: hasError || this.disabled,
        position: i,
        id: intervention.id,
        name: intervention.asDraft().name,
        status: InterventionUtils.getStatusFromLabel(intervention.status),
        order: intervention.asDraft().orderName,
        orderId: hasError ? '' : prestations[0].order,
        clientName: intervention.asDraft().clientName,
        clientId: intervention.asDraft().accountUuid,
        estateReference: intervention.asDraft().estateReference,
        estateAddress: intervention.asDraft().estateAddress,
        estateId: hasError ? '' : prestations[0].estate,
        prestations: prestasList.sort().join(', '),
      };
      i++;
      return data;
    });
  }

  getRouterLink = (columnName: string, row: EstateInterventionTableLine) => {
    switch (columnName) {
      case 'name':
        return ['/interventions', row.id, 'orders', row.orderId];
      case 'order':
        return ['/orders', row.orderId];
      case 'clientName':
        return ['/establishments', row.clientId]; // TODO Manage individuals
      default:
        return ['/interventions', row.id, 'orders', row.orderId];
    }
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

  getComboList = () => {
    const result = [];
    this.types.forEach(e => result.push(e.shortcut));
    return {prestations: result.sort()};
  }
}

export interface EstateInterventionTableLine extends TableLine {
  name: string;
  status: number;
  order?: string;
  orderId?: string;
  estateReference?: string;
  estateAddress?: string;
  estateId?: string;
  clientName?: string;
  clientId?: string;
  prestations?: string;
}
