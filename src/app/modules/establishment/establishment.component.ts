import {Component, EventEmitter, OnInit} from '@angular/core';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {
  EstablishmentAddressRole, EstablishmentComment, EstablishmentDelegateRole, EstablishmentPeopleRole,
  EstablishmentsService, EstablishmentWithRole, FullEstablishment
} from '../../services/backend/establishments.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Account, AccountsService, AccountStatus} from '../../services/backend/accounts.service';
import {AccountUtils} from '../utils/account-utils';
import {Address, AddressType, AddressWithRole} from '../../services/backend/addresses.service';
import {AddressFormData, AddressFormMode} from '../address-form/address-form.component';
import {AddressFormDialogComponent} from '../address-form/address-form-dialog/address-form-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {AddressUtils} from '../utils/address-utils';
import {InfoService} from '../../services/front/info.service';
import {ContactFormData, ContactFormMode} from '../contact-form/contact-form.component';
import {ContactFormDialogComponent} from '../contact-form/contact-form-dialog/contact-form-dialog.component';
import {People, PeopleWithRole} from '../../services/backend/people.service';
import {PeopleUtils} from '../utils/people-utils';
import {EstablishmentUtils} from '../utils/establishment-utils';
import {PlusActionData} from '../plus-button/plus-button.component';
import {DataComment, sortComments} from '../events/events.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {mergeMap} from 'rxjs/operators';
import {EstablishmentFormData, EstablishmentFormMode} from '../establishment-form/establishment-form.component';
import {EstablishmentFormDialogComponent} from '../establishment-form/establishment-form-dialog/establishment-form-dialog.component';

@Component({
  selector: 'app-establishment',
  templateUrl: './establishment.component.html',
  styleUrls: ['./establishment.component.scss']
})
export class EstablishmentComponent implements OnInit {

  isLoading = false;
  full: FullEstablishment;
  action = false;
  delegateRoles: string[] = Object.values(EstablishmentDelegateRole);
  contactRoles: string[] = Object.values(EstablishmentPeopleRole);
  addressRoles: string[] = Object.values(EstablishmentAddressRole);
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.POST];
  mainContacts: PeopleWithRole[] = [];
  mainAddresses: AddressWithRole[] = [];
  updateDelegateTab = new EventEmitter<void>();
  updateContactTab = new EventEmitter<void>();
  updateAddressTab = new EventEmitter<void>();
  establishmentId = '';
  dataComment: DataComment [] = [];
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;
  ascending = false;
  state: string[] = [];
  actionData: PlusActionData[] = [
    {
      label: 'Tiers',
      icon: 'add',
      function: () => this.createDelegate()
    },
    {
      label: 'Contact',
      icon: 'add',
      function: () => this.createContact()
    },
    {
      label: 'Adresse',
      icon: 'add',
      function: () => this.createAddress()
    }
  ];

  constructor(private navigationService: NavigationService,
              private router: Router,
              private route: ActivatedRoute,
              private infoService: InfoService,
              private accountsService: AccountsService,
              private establishmentsService: EstablishmentsService,
              public dialog: MatDialog) {
  }

  updateState() {
    this.isLoading = true;
    this.state = [];
    this.establishmentsService.getFullEstablishment(this.establishmentId).subscribe((establishment) => {
      if (!establishment) {
        console.log('An error occurred while retrieving establishment ' + this.establishmentId);
        this.router.navigate(['/establishments']);
        this.isLoading = false;
      } else {
        this.full = establishment;
        this.mainContacts = establishment.contacts.filter((c) => c.role === EstablishmentPeopleRole.MAIN);
        this.mainAddresses = establishment.addresses.filter((a) => a.role === EstablishmentAddressRole.MAIN);
        this.getAllComments();
        this.isLoading = false;
        if (!establishment.addresses || establishment.addresses.length === 0 || establishment.addresses.filter(a => a.role === EstablishmentAddressRole.MAIN).length < 1) {
          this.state.push('Établissement sans adresse principale.');
        }
        if ((!establishment.delegates || establishment.delegates.length === 0 || establishment.delegates.filter(a => a.role === EstablishmentDelegateRole.PURCHASER).length < 1) &&
          (!establishment.contacts || establishment.contacts.length === 0 || establishment.contacts.filter(a => a.role === EstablishmentPeopleRole.PURCHASER).length < 1)) {
          this.state.push('Établissement sans donneur d\'ordre.');
        }
      }
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.disabled = !this.userRights.accountManagement;
    this.navigationService.set({menu: MenuStep.ESTABLISHMENTS, url: this.router.url});
    this.route.params.subscribe(params => {
      this.establishmentId = params.id;
      this.establishmentsService.getFullEstablishment(params.id).subscribe((establishment) => {
        if (!establishment) {
          console.log('An error occurred while retrieving establishment ' + params.id);
          this.router.navigate(['/establishments']);
          this.isLoading = false;
        } else {
          this.full = establishment;
          this.mainContacts = establishment.contacts.filter((c) => c.role === EstablishmentPeopleRole.MAIN);
          this.mainAddresses = establishment.addresses.filter((a) => a.role === EstablishmentAddressRole.MAIN);
          this.isLoading = false;
          this.getAllComments();
          if (!establishment.addresses || establishment.addresses.length === 0 || establishment.addresses.filter(a => a.role === EstablishmentAddressRole.MAIN).length < 1) {
            this.state.push('Établissement sans adresse principale.');
          }
          if ((!establishment.delegates || establishment.delegates.length === 0 || establishment.delegates.filter(a => a.role === EstablishmentDelegateRole.PURCHASER).length < 1) &&
            (!establishment.contacts || establishment.contacts.length === 0 || establishment.contacts.filter(a => a.role === EstablishmentPeopleRole.PURCHASER).length < 1)) {
            this.state.push('Établissement sans donneur d\'ordre.');
          }
        }
      });
    });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  getAllComments() {
    this.establishmentsService.getAllComments(this.establishmentId).subscribe(comments => {
      this.dataComment = [];
      comments.forEach(c => this.dataComment.push({comment: c.comment, user: c.user, created: new Date(c.created), eventType: c.event}));
    });
  }

  saveComment(data: DataComment) {
    const comment: EstablishmentComment = {
      comment: data.comment, idEstablishment: this.establishmentId, user: data.user, event: 'MESSAGE'
    };
    this.establishmentsService.addComment(comment).subscribe(res => {
      if (!res) {
        console.log('error while adding comment');
      } else {
        this.dataComment.push({comment: res.comment, user: res.user, created: new Date(res.created)});
        this.dataComment = sortComments(this.ascending, this.dataComment);
      }
    });
  }

  createDelegate() {
    const data: EstablishmentFormData = {
      mode: EstablishmentFormMode.SEARCH,
      roles: this.delegateRoles
    };
    const dialogRef = this.dialog.open(EstablishmentFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((newEstablishment: EstablishmentWithRole) => {
      if (newEstablishment && newEstablishment.establishment.uuid) {
        this.establishmentsService.addEstablishmentDelegate(this.full.establishment.uuid, newEstablishment.establishment.uuid, newEstablishment.role).subscribe((done) => {
          if (done) {
            this.updateDelegateTab.emit();
            this.infoService.displaySaveSuccess();
            this.updateState();
          }
        });
      }
    });
  }

  createContact() {
    const data: ContactFormData = {
      mode: ContactFormMode.CREATE_OR_SEARCH,
      roles: this.contactRoles
    };
    const dialogRef = this.dialog.open(ContactFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((newContact: PeopleWithRole) => {
      if (newContact && newContact.people.uuid) {
        this.establishmentsService.addEstablishmentPeople(this.full.establishment.uuid, newContact.people.uuid, newContact.role).subscribe((done) => {
          if (done) {
            this.setMainContact(newContact);
            this.updateContactTab.emit();
            this.infoService.displaySaveSuccess();
            this.updateState();
          }
        });
      }
    });
  }

  createAddress() {
    const data: AddressFormData = {
      mode: AddressFormMode.CREATE,
      roles: this.addressRoles,
      types: this.addressTypes
    };
    const dialogRef = this.dialog.open(AddressFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((newAddress: AddressWithRole) => {
      if (newAddress && newAddress.address.uuid) {
        this.establishmentsService.addEstablishmentAddress(this.full.establishment.uuid, newAddress.address.uuid, newAddress.role).subscribe((done) => {
          if (done) {
            this.setMainAddress(newAddress);
            this.updateAddressTab.emit();
            this.infoService.displaySaveSuccess();
            this.updateState();
          }
        });
      }
    });
  }

  updateEstablishment(ewr: EstablishmentWithRole) {
    this.full.establishment = EstablishmentUtils.buildEstablishment(ewr.establishment);
    this.infoService.displaySaveSuccess();
  }

  updateContact(old: PeopleWithRole, updated: PeopleWithRole) {
    if (old.role !== updated.role) {
      this.establishmentsService.removeEstablishmentPeople(this.full.establishment.uuid, old.people.uuid, old.role)
        .pipe(mergeMap((done) => this.establishmentsService.addEstablishmentPeople(this.full.establishment.uuid, updated.people.uuid, updated.role)))
        .subscribe((done) => {
          if (done) {
            this.unsetMainContact(old);
            this.setMainContact(updated);
            this.updateContactTab.emit();
            this.infoService.displaySaveSuccess();
            this.updateState();
          }
        });
    } else {
      this.setMainContact(updated);
      this.updateState();
      this.updateContactTab.emit();
      this.infoService.displaySaveSuccess();
    }
  }

  updateAddress(old: AddressWithRole, updated: AddressWithRole) {
    if (old.role !== updated.role) {
      this.establishmentsService.removeEstablishmentAddress(this.full.establishment.uuid, old.address.uuid, old.role)
        .pipe(mergeMap((done) => this.establishmentsService.addEstablishmentAddress(this.full.establishment.uuid, updated.address.uuid, updated.role)))
        .subscribe((done) => {
          if (done) {
            this.unsetMainAddress(old);
            this.setMainAddress(updated);
            this.updateAddressTab.emit();
            this.infoService.displaySaveSuccess();
            this.updateState();
          }
        });
    } else {
      this.setMainAddress(updated);
      this.updateAddressTab.emit();
      this.infoService.displaySaveSuccess();
      this.updateState();
    }
  }

  removeContact(contact: PeopleWithRole) {
    this.establishmentsService.removeEstablishmentPeople(this.full.establishment.uuid, contact.people.uuid, contact.role).subscribe((done) => {
      if (done) {
        this.unsetMainContact(contact);
        this.updateContactTab.emit();
        this.infoService.displaySaveSuccess();
        this.updateState();
      }
    });
  }

  removeAddress(address: AddressWithRole) {
    this.establishmentsService.removeEstablishmentAddress(this.full.establishment.uuid, address.address.uuid, address.role).subscribe((done) => {
      if (done) {
        this.unsetMainAddress(address);
        this.updateAddressTab.emit();
        this.infoService.displaySaveSuccess();
        this.updateState();
      }
    });
  }

  getStatusColor(): string {
    if (Number(this.full.account.state) === AccountStatus.INACTIVE) {
      return 'red';
    } else if (this.full.hasOrders || Number(this.full.account.state) === AccountStatus.VALID) {
      return 'green';
    } else {
      return 'orange';
    }
  }

  getStatusName() {
    if (Number(this.full.account.state) === AccountStatus.INACTIVE) {
      return 'Compte désactivé';
    } else if (this.full.hasOrders || Number(this.full.account.state) === AccountStatus.VALID) {
      return 'Établissement validé';
    } else {
      return 'Compte non validé';
    }
  }

  getName(account: Account) {
    return AccountUtils.getName(account);
  }

  getAddressName(address: Address) {
    return AddressUtils.getFullName(address);
  }

  getContactName(contact: People) {
    return PeopleUtils.getName(contact);
  }

  setMainContact(pwr: PeopleWithRole) {
    if (pwr.role === EstablishmentPeopleRole.MAIN) {
      const index = this.mainContacts.findIndex(c => c.people.uuid === pwr.people.uuid);
      if (index < 0) {
        this.mainContacts.push(PeopleUtils.buildPeopleWithRole(pwr.people, pwr.role));
      } else {
        this.mainContacts[index] = PeopleUtils.buildPeopleWithRole(pwr.people, pwr.role);
      }
    }
  }

  unsetMainContact(pwr: PeopleWithRole) {
    if (pwr.role === EstablishmentPeopleRole.MAIN) {
      this.mainContacts = this.mainContacts.filter(c => c.people.uuid !== pwr.people.uuid);
    }
  }

  setMainAddress(awr: AddressWithRole) {
    if (awr.role === EstablishmentAddressRole.MAIN) {
      const index = this.mainAddresses.findIndex(c => c.address.uuid === awr.address.uuid);
      if (index < 0) {
        this.mainAddresses.push(AddressUtils.buildAddressWithRole(awr.address, awr.role));
      } else {
        this.mainAddresses[index] = AddressUtils.buildAddressWithRole(awr.address, awr.role);
      }
    }
  }

  unsetMainAddress(awr: AddressWithRole) {
    if (awr.role === EstablishmentAddressRole.MAIN) {
      this.mainAddresses = this.mainAddresses.filter(c => c.address.uuid !== awr.address.uuid);
    }
  }

  copyMessage(val: string): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.infoService.displayInfo('Le nom de l\'établissement a été copié !');
  }
}
