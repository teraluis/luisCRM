import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  Account, AccountComment, AccountsService, AccountStatus, AccountWithRole
} from '../../services/backend/accounts.service';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {People, PeopleAddressRole, PeopleService, PeopleWithRole} from '../../services/backend/people.service';
import {Address, AddressType, AddressWithRole} from '../../services/backend/addresses.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {InfoService} from '../../services/front/info.service';
import {AddressFormDialogComponent} from '../address-form/address-form-dialog/address-form-dialog.component';
import {AddressFormData, AddressFormMode} from '../address-form/address-form.component';
import {AccountUtils} from '../utils/account-utils';
import {PeopleUtils} from '../utils/people-utils';
import {AddressUtils} from '../utils/address-utils';
import {PlusActionData} from '../plus-button/plus-button.component';
import {DataComment, sortComments} from '../events/events.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {mergeMap} from 'rxjs/operators';
import {Location} from '@angular/common';
import {ConfirmationComponent} from '../confirmation/confirmation.component';

@Component({
  selector: 'app-individual',
  templateUrl: './individual.component.html',
  styleUrls: ['./individual.component.scss']
})
export class IndividualComponent implements OnInit {

  isLoading = false;
  account: Account;
  addresses: AddressWithRole[] = [];
  accountName: string;
  state: string[] = [];
  roles: string[] = Object.values(PeopleAddressRole);
  action = false;
  dataComment: DataComment[] = [];
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.POST];
  ascending = false;
  actionData: PlusActionData[] = [
    {
      label: 'Adresse',
      icon: 'add',
      function: () => this.createAddress()
    }
  ];

  constructor(private navigationService: NavigationService,
              private router: Router,
              private route: ActivatedRoute,
              private accountsService: AccountsService,
              private peopleService: PeopleService,
              private infoService: InfoService,
              public dialog: MatDialog,
              private location: Location) {
    if (this.userRights.financialManagemement) {
      this.actionData.push({
        label: 'Supprimer ce compte',
        icon: 'delete',
        function: () => {
          const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
            data: {title: 'Confirmation', text: `Êtes-vous sur de vouloir supprimer ce compte ?`},
            width: '40%'
          });
          deleteDialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.accountsService.delete(this.account.uuid).subscribe(done => {
                this.location.back();
              });
            }
          });
        }
      });
    }
  }

  private updateState() {
    if (!this.account.contact.addresses.find(a => a.role === PeopleAddressRole.MAIN)) {
      this.state = [];
      this.state.push('Une adresse principale est nécessaire afin de pouvoir effectuer une commande.');
    }
  }

  ngOnInit() {
    this.isLoading = true;
    this.disabled = !this.userRights.accountManagement;
    this.navigationService.set({menu: MenuStep.INDIVIDUALS, url: this.router.url});
    this.route.params.subscribe(params => {
      this.accountsService.getOne(params.id).subscribe((account) => {
        if (!account) {
          console.log('An error occurred while retrieving account ' + params.id);
          this.router.navigate(['/individuals']);
          this.isLoading = false;
        } else {
          this.account = account;
          this.accountName = AccountUtils.getName(account);
          this.addresses = account.contact.addresses.map(awr => AddressUtils.buildAddressWithRole(awr.address, awr.role));
          this.updateState();
          this.isLoading = false;
          this.getAllComments();
        }
      });
    });
  }

  saveComment(data: DataComment) {
    const comment: AccountComment = {
      comment: data.comment,
      idAccount: this.account.uuid,
      user: data.user
    };
    this.accountsService.addComment(comment).subscribe(res => {
      this.dataComment.push({comment: res.comment, user: res.user, created: new Date(res.created)});
      this.dataComment = sortComments(this.ascending, this.dataComment);
    });
  }

  getAllComments() {
    this.accountsService.getComments(this.account.uuid).subscribe(comments => {
      this.dataComment = [];
      comments.forEach(comment => {
        this.dataComment.push({comment: comment.comment, user: comment.user, created: new Date(comment.created)});
      });
    });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  getStatusName(status: number | string) {
    return AccountUtils.getStatusName(status);
  }

  getStatusColor(status: number | string) {
    return AccountUtils.getStatusColor(status);
  }

  validate() {
    const lastState = this.account.state;
    this.account.state = AccountStatus.VALID;
    this.accountsService.update(this.account).subscribe((account) => {
      if (!account) {
        console.log('An error occurred while updating account ' + this.account.uuid);
        this.account.state = lastState ? lastState : AccountStatus.INACTIVE;
      } else {
        this.infoService.displaySuccess('Le compte a été validé !');
      }
    });
  }

  createAddress() {
    const data: AddressFormData = {
      mode: AddressFormMode.CREATE,
      roles: this.roles,
      types: this.addressTypes
    };
    const dialogRef = this.dialog.open(AddressFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((awr: AddressWithRole) => {
      if (awr) {
        this.peopleService.addPeopleAddress(this.account.contact.uuid, awr.address.uuid, awr.role).subscribe((done) => {
          if (done) {
            this.addresses.push(awr);
            this.infoService.displaySaveSuccess();
          }
        });
      }
    });
  }

  updateAccount(account: AccountWithRole) {
    this.account = AccountUtils.buildAccount(account.account);
    this.infoService.displaySaveSuccess();
  }

  updateAddress(old: AddressWithRole, updated: AddressWithRole) {
    if (old.role !== updated.role) {
      this.peopleService.removePeopleAddress(this.account.contact.uuid, old.address.uuid, old.role)
        .pipe(mergeMap((done) => this.peopleService.addPeopleAddress(this.account.contact.uuid, updated.address.uuid, updated.role)))
        .subscribe((done) => {
          if (done) {
            this.addresses = this.addresses.filter(a => a.address.uuid !== old.address.uuid && a.role !== old.role);
            this.addresses.push(AddressUtils.buildAddressWithRole(updated.address, updated.role));
            this.infoService.displaySaveSuccess();
          }
        });
    } else {
      this.addresses[this.addresses.findIndex(c => c.address.uuid === updated.address.uuid && c.role === updated.role)] = AddressUtils.buildAddressWithRole(updated.address, updated.role);
      this.infoService.displaySaveSuccess();
    }
  }

  remove(awr: AddressWithRole) {
    this.peopleService.removePeopleAddress(this.account.contact.uuid, awr.address.uuid, awr.role).subscribe((done) => {
      if (done) {
        this.addresses = this.addresses.filter(a => a.address.uuid !== awr.address.uuid && a.role !== awr.role);
        this.infoService.displaySaveSuccess();
      }
    });
  }

  updateContact(contact: PeopleWithRole) {
    this.account.contact = PeopleUtils.buildPeople(contact.people);
    this.infoService.displaySaveSuccess();
  }

  getPeopleName(contact: People) {
    return PeopleUtils.getName(contact);
  }

  getAddressName(address: Address) {
    return AddressUtils.getFullName(address);
  }

  getName(account: Account) {
    return AccountUtils.getName(account);
  }

  isDeletableAddress(address: AddressWithRole) {
    return address.role !== PeopleAddressRole.MAIN || this.addresses.filter(a => a.role === PeopleAddressRole.MAIN).length > 1;
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
    this.infoService.displayInfo('Le nom du particulier a été copié !');
  }
}
