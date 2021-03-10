import {Component, EventEmitter, Input} from '@angular/core';
import {MatDialog, MatTableDataSource} from '@angular/material';
import {ActionEvent, ActionType, ColumnInformation, FilterType, TableLine, TableOption
} from "../../table-search-list/table-search-list.component";
import {Estate, EstatesService, EstateState} from "../../../services/backend/estates.service";
import {EstateUtils} from "../../utils/estate-utils";
import {AddressUtils} from "../../utils/address-utils";
import {EstateCreateData} from "../../estate-create/estate-create.component";
import {EstateCreateDialogComponent} from "../../estate-create/estate-create-dialog/estate-create-dialog.component";
import {EstateEditData} from "../../estate-edit/estate-edit.component";
import {EstateEditDialogComponent, EstateEditReturnValue} from "../../estate-edit/estate-edit-dialog/estate-edit-dialog.component";
import {Account} from "../../../services/backend/accounts.service";

@Component({
  selector: 'app-individual-estates',
  templateUrl: './individual-estates.component.html'
})
export class IndividualEstatesComponent {

  @Input() account: Account;
  @Input() disabled: boolean;

  estates: Estate[] = [];
  presentTypes: string[] = [];
  isEmpty = false;
  // Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.EDIT];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: 'reference',   title: 'Référence',     filterType: FilterType.TEXT,   filterDisabled: false, routerLink: () => 'estate/:id'},
    {name: 'estateType',  title: 'Type',          filterType: FilterType.TEXT,   filterDisabled: false},
    {name: 'addressName', title: 'Adresse',       filterType: FilterType.TEXT,   filterDisabled: false},
    {name: 'localitiesQ', title: 'Nb bâtiments',  filterType: FilterType.NUMBER, filterDisabled: false, maxWidthPx: 100, headerToolTip: 'Nombre de bâtiments'},
    {name: 'premisesQ',   title: 'Nb logements',  filterType: FilterType.NUMBER, filterDisabled: false, maxWidthPx: 100, headerToolTip: 'Nombre de logements'},
    {name: 'state',       title: 'État',          filterType: FilterType.STATUS, filterDisabled: true}
  ];
  displayedColumns = this.columnsInfos.map(value => value.name);
  maxRows = 10;
  dataSourceChange = new EventEmitter<{ dataSource: MatTableDataSource<TableLine>, filter: string }>();
  createAction = {label: 'Ajouter un bien', disabled: false, hidden: false, create: () => this.createEstate()};

  constructor(protected estatesService: EstatesService,
              protected dialog: MatDialog) {
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.estatesService.getFromAccount(this.account.uuid).subscribe((estates) => {
      this.estates = estates;
      const dataSource = new MatTableDataSource<IndividualEstateTableLine>(this.buildTableLine(estates));
      this.isEmpty = dataSource.data.length === 0;
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildTableLine(estates: Estate[]): IndividualEstateTableLine[] {
    let i = 1;
    return estates && estates.length ? estates.map((estate) => {
      if (estate.customEstateType && !this.presentTypes.includes(estate.customEstateType)) {
        this.presentTypes.push(estate.customEstateType);
      } else if (!estate.customEstateType && estate.estateType && !this.presentTypes.includes(estate.estateType.type)) {
        this.presentTypes.push(estate.estateType.type);
      }
      const data: IndividualEstateTableLine = {
        id: estate.id,
        reference: estate.estateReference ? estate.estateReference : estate.adxReference,
        name: estate.name,
        estateType: estate.customEstateType ? estate.customEstateType : estate.estateType.type,
        addressName: AddressUtils.getFullName(estate.localities[0].addresses[0]),
        localitiesQ: estate.localities.length,
        premisesQ: estate.localities.length > 0 ? estate.localities.map(value => value.premises.length).reduce((previousValue, currentValue) => currentValue + previousValue) : 0,
        state: estate.state,
        deleted: estate.deleted,
        position: i
      };
      i++;
      return data;
    }) : [];
  }

  clickEvent(actionEvent: ActionEvent) {
    const estateTableLine: IndividualEstateTableLine = actionEvent.event;
    if (actionEvent.action === ActionType.EDIT) {
      this.openEstate(this.estates.find(e => e.id === estateTableLine.id));
    }
  }

  createEstate() {
    const data: EstateCreateData = {
      defaultAccount: this.account
    };
    const dialogCreate = this.dialog.open(EstateCreateDialogComponent, {
      data: data,
      width: '75%'
    });
    dialogCreate.afterClosed().subscribe((newEstate: Estate) => {
      if (newEstate && newEstate.id) {
        this.setFilterData('');
        this.openEstate(newEstate);
      }
    });
  }

  openEstate(estate: Estate) {
    const data: EstateEditData = {
      estate: EstateUtils.buildEstate(estate),
      disabled: this.disabled
    };
    const dialogCreate = this.dialog.open(EstateEditDialogComponent, {
      data: data,
      width: '80vw'
    });
    dialogCreate.afterClosed().subscribe((resp: EstateEditReturnValue) => {
      if (resp && resp.hasChanged) {
        this.setFilterData('');
      }
    });
  }

  getRouterLink = (columnName: string, row: IndividualEstateTableLine) => {
    return ['/estates', row.id];
  }

  getStatusList = () => {
    const result = [];
    Object.values(EstateState).forEach(e => {
      if (!isNaN(Number(e))) {
        result.push({name: e, value: this.getStatusName(e)});
      }
    });
    return result;
  }

  getStatusName = (key: number | string) => {
    return EstateUtils.getStatusName(key);
  }

  getStatusColor = (key: number | string) => {
    return EstateUtils.getStatusColor(key);
  }

  getComboList = () => {
    return {estateType: this.presentTypes};
  }
}

export interface IndividualEstateTableLine extends TableLine {
  reference: string;
  name: string;
  estateType: string;
  addressName: string;
  localitiesQ: number;
  premisesQ: number;
  state: number;
  deleted: boolean;
}
