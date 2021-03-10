import {Component, DoCheck, EventEmitter, KeyValueDiffer, KeyValueDiffers, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {EntitiesService, Entity} from '../../services/backend/entities.service';
import {
  Account,
  AccountComment,
  AccountsService,
  AccountStatus,
  AccountWithRole
} from '../../services/backend/accounts.service';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {People, PeopleService, PeopleWithRole} from '../../services/backend/people.service';
import {Address, AddressType, AddressWithRole} from '../../services/backend/addresses.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {InfoService} from '../../services/front/info.service';
import {
  EstablishmentAddressRole,
  EstablishmentDelegateRole,
  EstablishmentsService,
  EstablishmentWithRole
} from '../../services/backend/establishments.service';
import {AccountUtils} from '../utils/account-utils';
import {PeopleUtils} from '../utils/people-utils';
import {AddressUtils} from '../utils/address-utils';
import {EstablishmentFormData, EstablishmentFormMode} from '../establishment-form/establishment-form.component';
import {EstablishmentFormDialogComponent} from '../establishment-form/establishment-form-dialog/establishment-form-dialog.component';
import {PlusActionData} from '../plus-button/plus-button.component';
import {DataComment, sortComments} from '../events/events.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {Location} from '@angular/common';
import {ConfirmationComponent} from '../confirmation/confirmation.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, DoCheck {

  isLoading = false;
  account: Account;
  mainAddress: Address;
  accountName: string;
  state: string[] = [];
  updateEstablishmentTab = new EventEmitter<void>();
  action = false;
  updated = false;
  dataComments: DataComment[] = [];
  ascending = false;
  actionData: PlusActionData[] = [];
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;
  addressTypes: AddressType[] = [AddressType.PHYSICAL, AddressType.POST];

  private differ: KeyValueDiffer<string, any>;

  constructor(private navigationService: NavigationService,
              private router: Router,
              private route: ActivatedRoute,
              private accountsService: AccountsService,
              private peopleService: PeopleService,
              private entitiesService: EntitiesService,
              private infoService: InfoService,
              private establishmentsService: EstablishmentsService,
              public dialog: MatDialog,
              private differs: KeyValueDiffers,
              private location: Location) {
    this.initActionButton();
    this.differ = this.differs.find({}).create();
  }

  ngDoCheck(): void {
    const change = this.differ.diff(this.account);
    if (change) {
      this.addValidateAccountButton();
    }
  }

  private updateState() {
    // TODO -> to move in account-establishment and set recap with EventEmitter
    this.state = [];
    this.establishmentsService.getFromEntity(this.account.entity.uuid).subscribe((establishments) => {
      if (!establishments || establishments.length === 0) {
        this.state.push('Un établissement est nécessaire pour pouvoir effectuer une commande.');
      } else {
        let nb1 = 0;
        let nb2 = 0;
        establishments.forEach((e) => {
          if (!e.addresses || e.addresses.length === 0 || e.addresses.filter(a => a.role === EstablishmentAddressRole.MAIN).length < 1) {
            nb1++;
          }
          if (!e.delegates || e.delegates.length === 0 || e.delegates.filter(a => a.role === EstablishmentDelegateRole.PURCHASER).length < 1) {
            nb2++;
          }
        });
        if (nb1 > 0) {
          this.state.push(nb1 + ' établissement' + (nb1 > 1 ? 's' : '') + ' sans adresse principale.');
        }
        if (nb2 > 0) {
          this.state.push(nb2 + ' établissement' + (nb2 > 1 ? 's' : '') + ' sans donneur d\'ordre.');
        }
      }
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.disabled = !this.userRights.accountManagement;
    this.navigationService.set({menu: MenuStep.ACCOUNTS_PRO, url: this.router.url});
    this.route.params.subscribe(params => {
      this.accountsService.getOne(params.id).subscribe((account) => {
        if (!account) {
          console.log('An error occurred while retrieving account ' + params.id);
          this.router.navigate(['/comptes']);
          this.isLoading = false;
        } else {
          this.account = account;
          this.accountName = AccountUtils.getName(account);
          this.mainAddress = account.entity.mainAddress;
          this.updateState();
          this.isLoading = false;
          this.getAllComments();
        }
      });
    });
  }

  getAllComments() {
    this.accountsService.getComments(this.account.uuid).subscribe((comments) => {
      comments.forEach((c) => this.dataComments.push(
        {
          comment: c.comment,
          user: c.user,
          created: new Date(c.created),
          eventType: c.event
        }
      ));
    });
  }

  saveComment(data: DataComment) {
    const comment: AccountComment = {
      idAccount: this.account.uuid,
      user: data.user,
      comment: data.comment,
      event: 'MESSAGE'
    };
    this.accountsService.addComment(comment).subscribe((newComment) => {
      if (newComment) {
        this.dataComments.push({
          comment: newComment.comment,
          user: newComment.user,
          created: new Date(newComment.created)
        });
        this.dataComments = sortComments(this.ascending, this.dataComments);
        this.infoService.displaySaveSuccess();
      }
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

  createEstablishment() {
    const data: EstablishmentFormData = {
      mode: EstablishmentFormMode.CREATE,
      defaultEntity: this.account.entity
    };
    const dialogRef = this.dialog.open(EstablishmentFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((establishment: EstablishmentWithRole) => {
      if (establishment) {
        this.infoService.displaySaveSuccess();
        this.updateEstablishmentTab.emit();
        this.updateState();
        this.getAllComments();
      }
    });
  }

  updateEntity(entity: Entity) {
    this.account.entity = AccountUtils.buildEntity(entity);
    this.accountName = AccountUtils.getName(this.account);
    this.infoService.displaySaveSuccess();
  }

  updateAccount(awr: AccountWithRole) {
    this.account = AccountUtils.buildAccount(awr.account);
    this.infoService.displaySaveSuccess();
  }

  updateContact(pwr: PeopleWithRole) {
    this.account.contact = PeopleUtils.buildPeople(pwr.people);
    this.infoService.displaySaveSuccess();
  }

  addAddress(awr: AddressWithRole) {
    this.account.entity.mainAddress = awr.address;
    this.entitiesService.update(this.account.entity).subscribe((updatedEntity) => {
      if (!updatedEntity) {
        console.log('An error occurred when updating entity ' + this.account.entity.uuid);
        this.account.entity.mainAddress = undefined;
      } else {
        this.account.entity = updatedEntity;
        this.infoService.displaySaveSuccess();
      }
    });
  }

  updateAddress(awr: AddressWithRole) {
    this.account.entity.mainAddress = AddressUtils.buildAddress(awr.address);
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

  private initActionButton() {
    this.actionData = [{
      label: 'Établissement',
      icon: 'add',
      function: () => this.createEstablishment()
    }];
    if (this.userRights.financialManagemement) {
      this.actionData.push({
        label: 'Supprimer ce compte',
        icon: 'delete',
        function: () => {
          const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
            data: {title: 'Confirmation', text: `Êtes-vous sur de vouloir supprimer le compte "${this.account.entity.name}" ?`},
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

  private addValidateAccountButton() {
    this.initActionButton();
    if (this.userRights.financialManagemement && this.account.state === AccountStatus.INVALID) {
      this.actionData.push({
        label: 'Valider le compte',
        icon: 'check',
        function: () => this.validate()
      });
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
    this.infoService.displayInfo('Le nom de compte a été copié !');
  }
}
