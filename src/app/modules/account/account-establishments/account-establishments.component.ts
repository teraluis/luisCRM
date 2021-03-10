import {Component, EventEmitter, Input, OnInit} from "@angular/core";
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {EstablishmentAddressRole, EstablishmentsService, EstablishmentWithRole, FullEstablishment
} from "../../../services/backend/establishments.service";
import {AddressUtils} from "../../utils/address-utils";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {InfoService} from "../../../services/front/info.service";
import {EstablishmentFormData, EstablishmentFormMode} from "../../establishment-form/establishment-form.component";
import {EstablishmentFormDialogComponent} from "../../establishment-form/establishment-form-dialog/establishment-form-dialog.component";
import {Account} from "../../../services/backend/accounts.service";
import {ActivityService, IActivity} from "../../../services/backend/activity.service";
import {EstablishmentUtils} from "../../utils/establishment-utils";
import {AgencyService, IAgency} from "../../../services/backend/agency.service";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-account-establishments',
  templateUrl: './account-establishments.component.html'
})
export class AccountEstablishmentsComponent implements OnInit, TableSearchListInterface {

  @Input() account: Account;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  action = false;
  establishments: FullEstablishment[];
  activities: IActivity[];
  agencies: IAgency[];
  // Datagrid
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['name', 'siret', 'address', 'activity', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false, routerLink: () => 'establishments/:id'},
    {name: this.displayedColumns[1], title: 'Siret', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Adresse', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Activité', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false},
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();

  constructor(private establishmentsService: EstablishmentsService,
              private activityService: ActivityService,
              private agencyService: AgencyService,
              private infoService: InfoService,
              protected dialog: MatDialog) {
  }

  ngOnInit() {
    forkJoin(
      this.activityService.getAll(),
      this.agencyService.getAll()
    ).subscribe(([activities, agencies]) => {
      this.activities = activities;
      this.agencies = agencies;
    });
    this.update.subscribe(() => this.setFilterData(''));
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.establishmentsService.getFromEntity(this.account.entity.uuid).subscribe((establishments) => {
      this.establishments = establishments;
      const dataSource = new MatTableDataSource<AccountEstablishmentTableLine>(this.buildAccountEstablishmentTableLine(establishments));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildAccountEstablishmentTableLine(establishments: FullEstablishment[]) {
    let i = 1;
    return establishments ? establishments.map(full => {
      const address = full.addresses.find(a => a.role === EstablishmentAddressRole.MAIN);
      const data: AccountEstablishmentTableLine = {
        position: i,
        id: full.establishment.uuid,
        name: full.establishment.name,
        siret: full.establishment.siret,
        address: AddressUtils.getFullName(address ? address.address : undefined),
        activity: full.establishment.activity ? full.establishment.activity.name : '',
        description: full.establishment.description,
        deletable: !this.disabled,
        actionDisabled: this.disabled
      };
      i++;
      return data;
    }) : [];
  }

  getComboList = () => {
    return {activity: this.activities};
  }

  getRouterLink = (columnName: string, row: AccountEstablishmentTableLine) => {
    return ['/establishments', row.id];
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: AccountEstablishmentTableLine = actionEvent.event;
    const full: FullEstablishment = this.establishments.find(e => e.establishment.uuid === event.id);
    if (actionEvent.action === ActionType.EDIT) {
      const data: EstablishmentFormData = {
        mode: EstablishmentFormMode.EDIT,
        disabled: this.disabled,
        defaultEntity: full.account.entity,
        defaultData: EstablishmentUtils.buildEstablishmentWithRole(full.establishment),
        defaultList: {activities: this.activities, agencies: this.agencies}
      };
      const dialogRef = this.dialog.open(EstablishmentFormDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogRef.afterClosed().subscribe((resp: EstablishmentWithRole) => {
        if (resp) {
          this.infoService.displaySaveSuccess();
          this.setFilterData('');
        }
      });
    } else if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir supprimer cet établissement ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.establishmentsService.delete(full.establishment.uuid).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.setFilterData('');
            }
          });
        }
      });
    }
  }
}

export interface AccountEstablishmentTableLine extends DeletableTableLine {
  name: string;
  siret: string;
  address: string;
  activity: string;
  description: string;
}
