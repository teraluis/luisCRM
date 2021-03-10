import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption, TableSearchListInterface
} from "../../table-search-list/table-search-list.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {EstablishmentPeopleRole, EstablishmentsService, FullEstablishment
} from "../../../services/backend/establishments.service";
import {PeopleUtils} from "../../utils/people-utils";
import {ConfirmationComponent} from "../../confirmation/confirmation.component";
import {ContactFormData, ContactFormMode} from "../../contact-form/contact-form.component";
import {ContactFormDialogComponent} from "../../contact-form/contact-form-dialog/contact-form-dialog.component";
import {InfoService} from "../../../services/front/info.service";
import {PeopleTitle, PeopleWithRole} from "../../../services/backend/people.service";
import {mergeMap} from "rxjs/operators";

@Component({
  selector: 'app-establishment-contacts',
  templateUrl: './establishment-contacts.component.html'
})
export class EstablishmentContactsComponent implements OnInit, TableSearchListInterface {

  @Input() full: FullEstablishment;
  @Input() update: EventEmitter<void>;
  @Input() disabled: boolean;

  @Output() updateContact = new EventEmitter<PeopleWithRole>();
  @Output() removeContact = new EventEmitter<PeopleWithRole>();

  action = false;
  contacts: PeopleWithRole[];
  // Datagrid
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [/* TableOption.EDIT,*/ TableOption.DELETE];
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

  constructor(private establishmentsService: EstablishmentsService,
              private infoService: InfoService,
              protected dialog: MatDialog) {
  }

  ngOnInit() {
    this.update.subscribe(() => {
      this.isLoading.emit(true);
      this.establishmentsService.getEstablishmentPeople(this.full.establishment.uuid).subscribe((contacts) => {
        this.contacts = contacts;
        this.setFilterData('');
        this.isLoading.emit(false);
      });
    });
    this.contacts = this.full.contacts;
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    const dataSource = new MatTableDataSource<EstablishmentContactTableLine>(this.buildContactTableLine(this.contacts));
    this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
  }

  buildContactTableLine(people: PeopleWithRole[]) {
    let i = 1;
    return people.map((pwr) => {
      const isUniqueMain = pwr.role === EstablishmentPeopleRole.MAIN && this.contacts.filter(c => c.role === EstablishmentPeopleRole.MAIN).length === 1;
      const data: EstablishmentContactTableLine = {
        position: i,
        deletable: !isUniqueMain,
        id: pwr.people.uuid,
        role: pwr.role,
        title: pwr.people.title,
        name: PeopleUtils.getName(pwr.people),
        mobilePhone: pwr.people.mobilePhone ? pwr.people.mobilePhone : pwr.people.workPhone,
        email: pwr.people.email ? pwr.people.email : pwr.people.workMail,
        description: pwr.people.jobDescription,
        actionDisabled: this.disabled
      };
      i++;
      return data;
    });
  }

  getComboList = () => {
    return {role: Object.values(EstablishmentPeopleRole), title: Object.values(PeopleTitle)};
  }

  clickEvent(actionEvent: ActionEvent) {
    const event: EstablishmentContactTableLine = actionEvent.event;
    const pwr: PeopleWithRole = this.contacts.find(a => a.people.uuid === event.id && a.role === event.role);
    const isUniqueMain = pwr.role === EstablishmentPeopleRole.MAIN && this.contacts.filter(c => c.role === EstablishmentPeopleRole.MAIN).length === 1;
    // TODO : removed on datagrid until we can display several on people, in the meantime you have to delete/add
    if (actionEvent.action === ActionType.EDIT) {
      const data: ContactFormData = {
        mode: ContactFormMode.EDIT,
        disabled: this.disabled,
        disabledRole: isUniqueMain,
        roles: Object.values(EstablishmentPeopleRole),
        defaultData: pwr
      };
      const dialogRef = this.dialog.open(ContactFormDialogComponent, {
        data: data,
        width: '60%'
      });
      dialogRef.afterClosed().subscribe((resp: PeopleWithRole) => {
        if (resp) {
          if (resp.role !== pwr.role) {
            this.establishmentsService.removeEstablishmentPeople(this.full.establishment.uuid, pwr.people.uuid, pwr.role)
              .pipe(mergeMap((done) => this.establishmentsService.addEstablishmentPeople(this.full.establishment.uuid, resp.people.uuid, resp.role)))
              .subscribe((done) => {
                if (done) {
                  this.infoService.displaySaveSuccess();
                  this.update.emit();
                  this.removeContact.emit(pwr);
                  this.updateContact.emit(resp);
                }
            });
          } else {
            this.infoService.displaySaveSuccess();
            this.update.emit();
            this.updateContact.emit(resp);
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
          this.establishmentsService.removeEstablishmentPeople(this.full.establishment.uuid, pwr.people.uuid, pwr.role).subscribe((resp) => {
            if (resp) {
              this.infoService.displaySaveSuccess();
              this.update.emit();
              this.removeContact.emit(pwr);
            }
          });
        }
      });
    }
  }
}

export interface EstablishmentContactTableLine extends DeletableTableLine {
  role: string;
  title: string;
  name: string;
  mobilePhone: string;
  email?: string;
  description?: string;
}
