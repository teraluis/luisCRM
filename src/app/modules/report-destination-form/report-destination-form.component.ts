import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {OrdersService, ReportDestination} from "../../services/backend/orders.service";
import {PeopleWithRole} from "../../services/backend/people.service";
import {AddressType, AddressWithRole} from "../../services/backend/addresses.service";
import {EstablishmentWithRole} from "../../services/backend/establishments.service";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-report-destination-form',
  templateUrl: './report-destination-form.component.html',
  styleUrls: ['./report-destination-form.component.scss']
})
export class ReportDestinationFormComponent implements OnInit {

  @Input() data: ReportDestinationFormData;

  @Output() repDestSaved = new EventEmitter<ReportDestination>();
  @Output() removeRepDest = new EventEmitter<ReportDestination>();
  @Output() cancelAction = new EventEmitter<void>();

  saving = false;
  currentData: ReportDestination;
  selectedType: ReportDestinationType;
  destinationTypes: string[] = Object.values(ReportDestinationType);
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.POST];
  types = {
    MAIL: ReportDestinationType.MAIL,
    URL: ReportDestinationType.URL,
    ADDRESS: ReportDestinationType.ADDRESS,
    PEOPLE: ReportDestinationType.PEOPLE,
    ESTABLISHMENT: ReportDestinationType.ESTABLISHMENT
  };

  constructor(private ordersService: OrdersService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    switch (this.data.mode) {
      case ReportDestinationFormMode.CREATE:
        this.currentData = {
          uuid: undefined,
          order: this.data.order,
          mail: undefined,
          url: undefined,
          address: undefined,
          people: undefined,
          establishment: undefined
        };
        this.selectedType = ReportDestinationType.MAIL;
        break;
      case ReportDestinationFormMode.EDIT:
        this.currentData = {
          uuid: this.data.defaultData.uuid,
          order: this.data.defaultData.order,
          mail: this.data.defaultData.mail,
          url: this.data.defaultData.url,
          address: this.data.defaultData.address,
          people: this.data.defaultData.people,
          establishment: this.data.defaultData.establishment
        };
        if (this.currentData.mail) {
          this.selectedType = ReportDestinationType.MAIL;
        } else if (this.currentData.url) {
          this.selectedType = ReportDestinationType.URL;
        } else if (this.currentData.address) {
          this.selectedType = ReportDestinationType.ADDRESS;
        } else if (this.currentData.people) {
          this.selectedType = ReportDestinationType.PEOPLE;
        } else if (this.currentData.establishment) {
          this.selectedType = ReportDestinationType.ESTABLISHMENT;
        }
        break;
      default:
        this.cancelAction.emit();
        break;
    }

  }

  isComplete() {
    switch (this.data.mode) {
      case ReportDestinationFormMode.CREATE:
        return this.isReportDestinationComplete();
      case ReportDestinationFormMode.EDIT:
        return this.isReportDestinationComplete() && this.isReportDestinationChanged();
      default:
        return false;
    }
  }

  save() {
    switch (this.data.mode) {
      case ReportDestinationFormMode.CREATE:
        if (!this.currentData.uuid) {
          this.addReportDestination();
        } else {
          this.updateReportDestination();
        }
        break;
      case ReportDestinationFormMode.EDIT:
        this.updateReportDestination();
        break;
      default:
        break;
    }
  }

  isReportDestinationComplete() {
    return this.currentData.mail || this.currentData.url || this.currentData.establishment || this.currentData.address || this.currentData.people;
  }

  isReportDestinationChanged() {
    return this.currentData.mail !== this.data.defaultData.mail || this.currentData.url !== this.data.defaultData.url
      || (this.currentData.establishment && !this.data.defaultData.establishment)
      || (this.currentData.establishment && this.data.defaultData.establishment && this.currentData.establishment.uuid !== this.data.defaultData.establishment.uuid)
      || (this.currentData.address && !this.data.defaultData.address)
      || (this.currentData.address && this.data.defaultData.address && this.currentData.address.uuid !== this.data.defaultData.address.uuid)
      || (this.currentData.people && !this.data.defaultData.people)
      || (this.currentData.people && this.data.defaultData.people && this.currentData.people.uuid !== this.data.defaultData.people.uuid);
  }

  addReportDestination() {
    this.saving = true;
    this.ordersService.addReportDestination(this.currentData).subscribe((resp) => {
      if (!resp || !resp.uuid) {
        console.log('An error occurred while adding a new report destination');
      } else {
        this.currentData.uuid = resp.uuid;
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  updateReportDestination() {
    this.saving = true;
    this.ordersService.updateReportDestination(this.currentData).subscribe((resp) => {
      if (!resp) {
        console.log('An error occurred while updating report destination');
      } else {
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = {
      uuid: this.currentData.uuid,
      order: this.currentData.order,
      mail: this.currentData.mail,
      url: this.currentData.url,
      address: this.currentData.address,
      people: this.currentData.people,
      establishment: this.currentData.establishment
    };
    this.repDestSaved.emit(this.currentData);
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  resetData() {
    this.currentData.mail = this.data.defaultData && this.selectedType === ReportDestinationType.MAIL ? this.data.defaultData.mail : undefined;
    this.currentData.url = this.data.defaultData && this.selectedType === ReportDestinationType.URL ? this.data.defaultData.url : undefined;
    this.currentData.address = this.data.defaultData && this.selectedType === ReportDestinationType.ADDRESS ? this.data.defaultData.address : undefined;
    this.currentData.people = this.data.defaultData && this.selectedType === ReportDestinationType.PEOPLE ? this.data.defaultData.people : undefined;
    this.currentData.establishment = this.data.defaultData && this.selectedType === ReportDestinationType.ESTABLISHMENT ? this.data.defaultData.establishment : undefined;
  }

  saveContact(pwr: PeopleWithRole) {
    this.currentData.people = pwr.people;
    this.save();
  }

  saveAddress(awr: AddressWithRole) {
    this.currentData.address = awr.address;
    this.save();
  }

  saveEstablishment(ewr: EstablishmentWithRole) {
    this.currentData.establishment = ewr.establishment;
    this.save();
  }

  delete(repDest: ReportDestination) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cette destination ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeRepDest.emit(repDest);
      }
    });
  }
}

export interface ReportDestinationFormData {
  mode: ReportDestinationFormMode | string; // Create mode
  order: string;                            // Create mode
  disabled?: boolean;                       // Disable fields
  deletable?: boolean;                      // Show delete button
  defaultData?: ReportDestination;          // Default data
}

export enum ReportDestinationFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}

export enum ReportDestinationType {
  MAIL = 'Mail',
  URL = 'Url',
  ADDRESS = 'Adresse',
  PEOPLE = 'Contact',
  ESTABLISHMENT = 'Établissement'
}
