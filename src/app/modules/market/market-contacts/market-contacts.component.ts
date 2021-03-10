import {Component, EventEmitter, Input, OnInit} from "@angular/core";
import {
  ActionEvent,
  ActionType,
  ColumnInformation,
  DeletableTableLine,
  FilterType,
  TableOption,
  TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {PeopleUtils} from "../../utils/people-utils";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {ContactFormData, ContactFormMode} from "../../contact-form/contact-form.component";
import {ContactFormDialogComponent} from "../../contact-form/contact-form-dialog/contact-form-dialog.component";
import {InfoService} from "../../../services/front/info.service";
import {IMarket, MarketPeople, MarketPeopleRole, MarketsService} from "../../../services/backend/markets.service";
import {PeopleTitle, PeopleWithRole} from "../../../services/backend/people.service";

@Component({
  selector: 'app-market-contacts',
  templateUrl: './market-contacts.component.html'
})
export class MarketContactsComponent implements OnInit, TableSearchListInterface {

  @Input() market: IMarket;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['role', 'title', 'name', 'mobilePhone', 'email', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Rôle', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Civilité', filterType: FilterType.CHECK, filterDisabled: false, maxWidthPx: 100},
    {name: this.displayedColumns[2], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Téléphone', filterType: FilterType.TEXT, filterDisabled: false, maxWidthPx: 100},
    {name: this.displayedColumns[4], title: 'Email', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false},
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;
  contacts: PeopleWithRole[];

  constructor(private marketsService: MarketsService,
              private infoService: InfoService,
              protected dialog: MatDialog) {
  }

  ngOnInit() {
    this.update.subscribe(() => this.setFilterData(''));
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.marketsService.getContact(this.market.uuid).subscribe((contacts) => {
      this.contacts = contacts.map(contact => PeopleUtils.buildPeopleWithRole(contact.people, contact.role));
      const dataSource = new MatTableDataSource<MarketContactTableLine>(this.buildMarketContactTableLine(this.contacts));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildMarketContactTableLine(contacts: PeopleWithRole[]) {
    let i = 1;
    return contacts.map(pwr => {
      const isUniqueKey = pwr.role === MarketPeopleRole.KEY && this.contacts.filter(c => c.role === MarketPeopleRole.KEY).length === 1;
      const data: MarketContactTableLine = {
        position: i,
        deletable: !this.disabled && !isUniqueKey,
        id: pwr.people.uuid,
        role: pwr.role,
        title: pwr.people.title,
        name: PeopleUtils.getName(pwr.people),
        mobilePhone: pwr.people.mobilePhone,
        email: pwr.people.email,
        description: pwr.people.jobDescription,
        actionDisabled: this.disabled
      };
      i++;
      return data;
    });
  }

  getComboList = () => {
    return {role: Object.values(MarketPeopleRole), title: Object.values(PeopleTitle)};
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: MarketContactTableLine = actionEvent.event;
    const contact: PeopleWithRole = this.contacts.find(c => c.people.uuid === event.id && c.role === event.role);
    if (actionEvent.action === ActionType.EDIT) {
      const isUniqueKey = contact.role === MarketPeopleRole.KEY && this.contacts.filter(c => c.role === MarketPeopleRole.KEY).length === 1;
      const data: ContactFormData = {
        mode: ContactFormMode.EDIT,
        disabled: this.disabled,
        disabledRole: isUniqueKey,
        roles: Object.values(MarketPeopleRole),
        defaultData: contact
      };
      const dialogRef = this.dialog.open(ContactFormDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogRef.afterClosed().subscribe((resp: PeopleWithRole) => {
        if (resp) {
          if (resp.role !== contact.role) {
            this.marketsService.updateContact(new MarketPeople(this.market, resp.people, resp.role), contact.role).subscribe((done1) => {
              this.infoService.displaySaveSuccess();
              this.setFilterData('');
            });
          } else {
            this.infoService.displaySaveSuccess();
            this.setFilterData('');
          }
        }
      });
    } else if (actionEvent.action === ActionType.DELETE) {
      const dialogRef = this.dialog.open(ConfirmationComponent, {
        width: '30%',
        data: {
          title: 'Attention',
          text: 'Êtes-vous sûr de vouloir enlever le lien avec ce contact ?'
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.marketsService.deleteContact(this.market.uuid, contact.people.uuid, contact.role).subscribe((resp) => {
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

export interface MarketContactTableLine extends DeletableTableLine {
  role: string;
  title: string;
  name: string;
  mobilePhone: string;
  email?: string;
  description?: string;
}
