import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {FullEstablishment, EstablishmentDelegateRole, EstablishmentsService, EstablishmentWithRole
} from "../../../services/backend/establishments.service";
import {InfoService} from "../../../services/front/info.service";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {AccountUtils} from "../../utils/account-utils";
import {AccountStatus} from "../../../services/backend/accounts.service";
import {AddressUtils} from "../../utils/address-utils";

@Component({
  selector: 'app-establishment-delegates',
  templateUrl: './establishment-delegates.component.html'
})
export class EstablishmentDelegatesComponent implements OnInit, TableSearchListInterface {

  @Input() full: FullEstablishment;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  @Output() updateEstablishment: EventEmitter<void> = new EventEmitter<void>();

  loading = false;
  action = false;
  delegates: EstablishmentWithRole[];
  // Datagrid
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.DELETE];
  displayedColumns = ['name', 'role', 'siret', 'address', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'establishments/:id'},
    {name: this.displayedColumns[1], title: 'Rôle', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Siret', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Adresse', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();

  constructor(private establishmentsService: EstablishmentsService,
              private infoService: InfoService,
              protected dialog: MatDialog) {
  }

  ngOnInit() {
    this.update.subscribe(() => {
      this.isLoading.emit(true);
      this.establishmentsService.getEstablishmentDelegates(this.full.establishment.uuid).subscribe((delegates) => {
        this.delegates = delegates;
        this.setFilterData('');
        this.isLoading.emit(false);
      });
    });
    this.delegates = this.full.delegates;
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    const dataSource = new MatTableDataSource<EstablishmentDelegateTableLine>(this.buildDelegateTableLine(this.delegates));
    this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
  }

  buildDelegateTableLine(delegates: EstablishmentWithRole[]) {
    let i = 1;
    return delegates ? delegates.map((ewr) => {
      const data: EstablishmentDelegateTableLine = {
        position: i,
        deletable: true,
        id: ewr.establishment.uuid,
        name: ewr.establishment.name,
        role: ewr.role,
        siret: ewr.establishment.siret,
        address: AddressUtils.getLocality(ewr.establishment.address),
        description: ewr.establishment.description,
        actionDisabled: this.disabled
      };
      i++;
      return data;
    }) : [];
  }

  clickEvent(actionEvent: ActionEvent) {
    const tableLine: EstablishmentDelegateTableLine = actionEvent.event;
    const ewr: EstablishmentWithRole = this.delegates.find(a => a.establishment.uuid === tableLine.id);
    if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir enlever le lien avec cet établissement ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.establishmentsService.removeEstablishmentDelegate(this.full.establishment.uuid, ewr.establishment.uuid, ewr.role).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.update.emit();
              this.updateEstablishment.emit();
            }
          });
        }
      });
    }
  }

  getComboList = () => {
    return {role: Object.values(EstablishmentDelegateRole)};
  }

  getStatusList = () => {
    const result = [];
    Object.values(AccountStatus).forEach(e => {
      if (!isNaN(Number(e))) {
        result.push({name: e, value: this.getStatusName(e)});
      }
    });
    return result;
  }

  getStatusColor = (key: number | string) => {
    return AccountUtils.getStatusColor(key);
  }

  getStatusName = (key: number | string) => {
    return AccountUtils.getStatusName(key);
  }

  getRouterLink = (columnName: string, row: EstablishmentDelegateTableLine) => {
    return ['/establishments', row.id];
  }
}

export interface EstablishmentDelegateTableLine extends DeletableTableLine {
  name: string;
  role: string;
  siret: string;
  address: string;
  description: string;
}
