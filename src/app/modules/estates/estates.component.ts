import {Component, EventEmitter, OnInit} from '@angular/core';
import {MatDialog, MatTableDataSource} from '@angular/material';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {Router} from '@angular/router';
import {ColumnInformation, FilterType, TableLine, TableOption} from "../table-search-list/table-search-list.component";
import {SidePanelType} from "../../services/front/sidepanel.service";
import {Estate, EstatesService, EstateState} from "../../services/backend/estates.service";
import {take} from 'rxjs/operators';
import {EstateCreateDialogComponent} from "../estate-create/estate-create-dialog/estate-create-dialog.component";
import {EstateCreateData} from "../estate-create/estate-create.component";
import {EstateOwnerType, EstateUtils} from "../utils/estate-utils";
import {PlusActionData} from "../plus-button/plus-button.component";
import {AddressUtils} from "../utils/address-utils";
import {ManagementRights} from '../../core/rights/ManagementRights';

@Component({
  selector: 'app-estates',
  templateUrl: './estates.component.html',
  styleUrls: ['./estates.component.scss']
})
export class EstatesComponent implements OnInit {

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.REORDER, TableOption.PREVIEW];
  userRights: ManagementRights = new ManagementRights();
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: 'reference',   title: 'Référence',     filterType: FilterType.TEXT,   filterDisabled: false, maxWidthPx: 100, routerLink: () => 'estates/:id'},
    {name: 'estateType',  title: 'Type',          filterType: FilterType.TEXT,   filterDisabled: false},
    {name: 'ownerName',   title: 'Client',        filterType: FilterType.TEXT,   filterDisabled: false, routerLink: (e) => (e.isEstablishment ? 'establishments' : 'comptes') + '/:ownerId'},
    {name: 'addressName', title: 'Adresse',       filterType: FilterType.TEXT,   filterDisabled: false},
    {name: 'localitiesQ', title: 'Nb bâtiments',  filterType: FilterType.NUMBER, filterDisabled: false, maxWidthPx: 100, headerToolTip: 'Nombre de bâtiments'},
    {name: 'premisesQ',   title: 'Nb logements',  filterType: FilterType.NUMBER, filterDisabled: false, maxWidthPx: 100, headerToolTip: 'Nombre de logements'},
    {name: 'state',       title: 'État',          filterType: FilterType.STATUS, filterDisabled: true}
  ];
  displayedColumns = this.columnsInfos.map(value => value.name);
  maxRows = 10;
  sidePanelType = SidePanelType.ESTATE;
  dataSourceChange = new EventEmitter<{ dataSource: MatTableDataSource<TableLine>, filter: string }>();
  action = false;
  actionData: PlusActionData[] = [
    {
      label: 'Bien',
      icon: 'add',
      function: () => this.createEstate()
    }
  ];

  constructor(private navigationService: NavigationService,
              private router: Router,
              protected estatesService: EstatesService,
              protected dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.navigationService.set({menu: MenuStep.ESTATES, url: this.router.url});
  }

  setPageData(page: number) {
    this.isLoading.emit(true);
    this.estatesService.getPage(page, this.maxRows).pipe(take(1)).subscribe((estates) => {
      const dataSource = new MatTableDataSource<EstateTableLine>(this.buildTableLine(estates));
      this.dataSourceChange.emit({dataSource: dataSource, filter: null});
      this.isLoading.emit(false);
    });
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.estatesService.getAll().subscribe((estates) => {
      const dataSource = new MatTableDataSource<EstateTableLine>(this.buildTableLine(estates));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildTableLine(estates: Estate[]): EstateTableLine[] {
    let i = 1;
    return estates && estates.length ? estates.map((estate) => {
      const data: EstateTableLine = {
        id: estate.id,
        reference: estate.estateReference ? estate.estateReference : estate.adxReference,
        name: estate.name,
        estateType: estate.customEstateType ? estate.customEstateType : estate.estateType.type,
        ownerName: EstateUtils.getOwnerName(estate),
        ownerId: estate.establishment ? estate.establishment.uuid : estate.account.uuid,
        isEstablishment: !!estate.establishment,
        ownerType: EstateUtils.getOwnerType(estate),
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

  createEstate() {
    const data: EstateCreateData = {};
    const addDialogRef = this.dialog.open(EstateCreateDialogComponent, {
      data: data,
      width: '60%'
    });
    addDialogRef.afterClosed().subscribe((newEstate: Estate) => {
      if (newEstate) {
        this.router.navigate(['/estates/' + newEstate.id]);
      }
    });
  }

  getRouterLink = (columnName: string, row: EstateTableLine) => {
    if (columnName === 'ownerName') {
      switch (row.ownerType) {
        case EstateOwnerType.ESTABLISHMENT:
          return ['/establishments', row.ownerId];
        case EstateOwnerType.ACCOUNT:
          return ['/comptes', row.ownerId];
        case EstateOwnerType.INDIVIDUAL:
          return ['/individuals', row.ownerId];
        default:
          return ['/estates', row.id];
      }
    } else {
      return ['/estates', row.id];
    }
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
}

export interface EstateTableLine extends TableLine {
  reference: string;
  name: string;
  estateType: string;
  ownerName: string;
  addressName: string;
  localitiesQ: number;
  premisesQ: number;
  state: number;
  deleted: boolean;
  // Used by getRouterLink
  ownerId: string;
  ownerType: EstateOwnerType;
  isEstablishment: boolean;
}
