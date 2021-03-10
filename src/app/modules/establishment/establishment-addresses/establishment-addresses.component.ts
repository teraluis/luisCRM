import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {EstablishmentAddressRole, EstablishmentsService, FullEstablishment
} from "../../../services/backend/establishments.service";
import {AddressType, AddressWithRole} from "../../../services/backend/addresses.service";
import {AddressUtils} from "../../utils/address-utils";
import {AddressFormDialogComponent} from "../../address-form/address-form-dialog/address-form-dialog.component";
import {AddressFormData, AddressFormMode} from "../../address-form/address-form.component";
import {InfoService} from "../../../services/front/info.service";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {mergeMap} from "rxjs/operators";

@Component({
  selector: 'app-establishment-addresses',
  templateUrl: './establishment-addresses.component.html'
})
export class EstablishmentAddressesComponent implements OnInit, TableSearchListInterface {

  @Input() full: FullEstablishment;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  @Output() updateAddress = new EventEmitter<AddressWithRole>();
  @Output() removeAddress = new EventEmitter<AddressWithRole>();

  action = false;
  addresses: AddressWithRole[];
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.POST];
  // Datagrid
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['role', 'type', 'address1', 'address2', 'locality'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Rôle', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Type', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Adresse', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Complément', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Localité', filterType: FilterType.TEXT, filterDisabled: false},
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
      this.establishmentsService.getEstablishmentAddress(this.full.establishment.uuid).subscribe((addresses) => {
        this.addresses = addresses;
        this.setFilterData('');
        this.isLoading.emit(false);
      });
    });
    this.addresses = this.full.addresses;
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    const dataSource = new MatTableDataSource<EstablishmentAddressTableLine>(this.buildAddressTableLine(this.addresses));
    this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
  }

  buildAddressTableLine(addresses: AddressWithRole[]) {
    let i = 1;
    return addresses.map(awr => {
      const isUniqueMain = awr.role === EstablishmentAddressRole.MAIN && this.addresses.filter(c => c.role === EstablishmentAddressRole.MAIN).length === 1;
      const data: EstablishmentAddressTableLine = {
        position: i,
        deletable: !isUniqueMain,
        id: awr.address.uuid,
        role: awr.role,
        type: awr.address.type,
        address1: awr.address.address1 ? awr.address.address1 : AddressUtils.getName(awr.address),
        address2: awr.address.address2 ? awr.address.address2 : '',
        locality: awr.address.postCode ? AddressUtils.getLocality(awr.address) : '',
        actionDisabled: this.disabled
      };
      i++;
      return data;
    });
  }

  getComboList = () => {
    return {role: Object.values(EstablishmentAddressRole), type: Object.values(AddressType)};
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: EstablishmentAddressTableLine = actionEvent.event;
    const awr: AddressWithRole = this.addresses.find(a => a.address.uuid === event.id);
    if (actionEvent.action === ActionType.EDIT) {
      const isUniqueMain = awr.role === EstablishmentAddressRole.MAIN && this.addresses.filter(c => c.role === EstablishmentAddressRole.MAIN).length === 1;
      const data: AddressFormData = {
        mode: AddressFormMode.EDIT,
        disabled: this.disabled,
        disabledRole: isUniqueMain,
        roles: Object.values(EstablishmentAddressRole),
        defaultData: AddressUtils.buildAddressWithRole(awr.address, awr.role),
        types: this.addressTypes
      };
      const dialogRef = this.dialog.open(AddressFormDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogRef.afterClosed().subscribe((resp: AddressWithRole) => {
        if (resp) {
          if (resp.role !== awr.role) {
            this.establishmentsService.removeEstablishmentAddress(this.full.establishment.uuid, awr.address.uuid, awr.role)
              .pipe(mergeMap((done) => this.establishmentsService.addEstablishmentAddress(this.full.establishment.uuid, resp.address.uuid, resp.role)))
              .subscribe((done) => {
                if (done) {
                  this.infoService.displaySaveSuccess();
                  this.update.emit();
                  this.removeAddress.emit(awr);
                  this.updateAddress.emit(resp);
                }
            });
          } else {
            this.infoService.displaySaveSuccess();
            this.update.emit();
            this.updateAddress.emit(resp);
          }
        }
      });
    } else if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir enlever le lien avec cette adresse ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.establishmentsService.removeEstablishmentAddress(this.full.establishment.uuid, awr.address.uuid, awr.role).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.update.emit();
              this.removeAddress.emit(awr);
            }
          });
        }
      });
    }
  }
}

export interface EstablishmentAddressTableLine extends DeletableTableLine {
  role: string;
  type: string;
  address1: string;
  address2: string;
  locality?: string;
}
