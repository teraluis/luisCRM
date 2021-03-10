import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Account, AccountCategory, AccountLevel, AccountsService, AccountStatus, AccountType, AccountWithRole
} from '../../services/backend/accounts.service';
import {EntitiesService, Entity} from '../../services/backend/entities.service';
import {debounceTime} from 'rxjs/operators';
import {InfoService} from '../../services/front/info.service';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {PeopleWithRole} from "../../services/backend/people.service";
import {MatStepper} from "@angular/material/stepper";
import {GroupService, IGroup} from "../../services/backend/group.service";
import {AccountUtils} from "../utils/account-utils";
import {PeopleUtils} from "../utils/people-utils";
import {User, UsersService} from "../../services/backend/users.service";
import {of} from "rxjs";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";

@Component({
  selector: 'app-account-form',
  templateUrl: './account-form.component.html',
  styleUrls: ['./account-form.component.scss']
})
export class AccountFormComponent implements OnInit {

  @ViewChild('stepper') stepper: MatStepper;

  @Input() data: AccountFormData;

  @Output() accountSaved = new EventEmitter<AccountWithRole>();
  @Output() removeAccount = new EventEmitter<AccountWithRole>();
  @Output() cancelAction = new EventEmitter<void>();
  @Output() redirect = new EventEmitter<void>();

  accountForm: FormGroup;

  entity: Entity;
  currentData: AccountWithRole;
  viewForm: boolean;
  searchField: string;
  searchUserField: string;
  search: FormControl;
  suggestedAccount: Account[];
  searchLoading = false;
  isSirenUnique = true;
  lastSiren: string;
  categoryList: string[] = Object.values(AccountCategory);
  typeList: string[] = Object.values(AccountType);
  importanceLevels: string[] = Object.values(AccountLevel);
  allGroups: IGroup[];
  editEntity = false;
  loading: boolean;
  saving = false;
  commercials: User[] = [];
  selectedCommercial: User;
  proType = AccountType.PROFESSIONAL;
  mode = {
    CREATE: AccountFormMode.CREATE,
    EDIT: AccountFormMode.EDIT,
    SEARCH: AccountFormMode.SEARCH,
    CREATE_OR_SEARCH: AccountFormMode.CREATE_OR_SEARCH
  };

  constructor(private accountsService: AccountsService,
              private entitiesService: EntitiesService,
              private infoService: InfoService,
              private groupService: GroupService,
              private usersService: UsersService,
              private fb: FormBuilder,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loading = true;
    this.viewForm = this.data.mode === AccountFormMode.CREATE || this.data.mode === AccountFormMode.EDIT;
    this.search = new FormControl({value: this.searchField, disabled: this.data.disabled});
    this.search.valueChanges.pipe(debounceTime(300))
      .subscribe((res) => this.suggest(res));
    this.initialize();
    this.groupService.getAll().subscribe((groups) => {
      if (!groups) {
        console.log('An error occurred while retrieving the list of Group');
        this.allGroups = [];
        this.loading = false;
      } else {
        this.allGroups = groups;
        if (this.data.mode === AccountFormMode.EDIT) {
          this.groupService.getAccountGroups(this.currentData.account.uuid).subscribe((accountGroups) => {
            if (!accountGroups) {
              console.log('An error occurred while retrieving the list of Group for ', this.currentData.account.uuid);
            } else {
              this.currentData.account.groups = accountGroups.map(g => g.uuid);
              this.accountForm.get('groups').setValue(this.currentData.account.groups);
              this.data.defaultData.account.groups = accountGroups.map(g => g.uuid);
            }
            this.loading = false;
          });
        } else {
          this.loading = false;
        }
      }
    });
  }

  initialize() {
    switch (this.data.mode) {
      case AccountFormMode.CREATE:
        this.entity = this.data.defaultData && this.data.defaultData.account
          ? AccountUtils.duplicateEntity(this.data.defaultData.account.entity)
          : AccountUtils.buildEntity();
        this.currentData = this.data.defaultData
          ? AccountUtils.buildAccountWithRole(AccountUtils.duplicate(this.data.defaultData.account), this.data.defaultData.role)
          : AccountUtils.buildAccountWithRole();
        if (this.data.forceType) {
          this.currentData.account.type = this.data.forceType;
        }
        break;
      case AccountFormMode.EDIT:
        this.entity = AccountUtils.buildEntity(this.data.defaultData.account.entity);
        this.currentData = AccountUtils.buildAccountWithRole(this.data.defaultData.account, this.data.defaultData.role);
        break;
      case AccountFormMode.SEARCH:
        this.entity = this.data.defaultData && this.data.defaultData.account
          ? AccountUtils.buildEntity(this.data.defaultData.account.entity)
          : AccountUtils.buildEntity();
        this.currentData = this.data.defaultData
          ? AccountUtils.buildAccountWithRole(this.data.defaultData.account, this.data.defaultData.role)
          : AccountUtils.buildAccountWithRole();
        break;
      case AccountFormMode.CREATE_OR_SEARCH:
        this.entity = AccountUtils.buildEntity();
        this.currentData = AccountUtils.buildAccountWithRole();
        if (this.data.forceType) {
          this.currentData.account.type = this.data.forceType;
        }
        break;
      default:
        this.entity = AccountUtils.buildEntity();
        this.currentData = AccountUtils.buildAccountWithRole();
        this.cancelAction.emit();
        break;
    }
    this.selectedCommercial = this.currentData.account.commercial;
    this.searchUserField = this.getName(this.selectedCommercial);

    this.accountForm = this.fb.group({
      role: [{value: this.currentData.role, disabled: this.data.disabled || this.data.disabledRole}, this.data.roles ? [Validators.required] : []],
      accountType: [{value: this.currentData.account.type, disabled: !!this.data.forceType}, this.data.mode === this.mode.EDIT ? [] : Validators.required],
      commercial: [{value: this.getName(this.selectedCommercial), disabled: this.data.disabled}, [Validators.required]],
      category: [{value: this.currentData.account.category, disabled: this.data.disabled}, Validators.required],
      importance: [{value: this.currentData.account.importance, disabled: this.data.disabled}],
      groups: [{value: this.currentData.account.groups, disabled: this.data.disabled}],
      name: [{value: this.entity.name, disabled: this.data.disabled}, this.currentData.account.type === this.proType && this.data.mode !== this.mode.EDIT ? [Validators.required] : []],
      corporateName: [{value: this.entity.corporateName, disabled: this.data.disabled}, this.currentData.account.type === this.proType && this.data.mode !== this.mode.EDIT ? [Validators.required] : []],
      siren: [{value: this.entity.siren, disabled: this.data.disabled}, this.currentData.account.type === this.proType && this.data.mode !== this.mode.EDIT ? [Validators.required, Validators.maxLength(9), Validators.minLength(9), Validators.pattern('\\d{9}')] : []]
    });
  }

  isComplete() {
    switch (this.data.mode) {
      case AccountFormMode.CREATE:
        return this.isAccountComplete();
      case AccountFormMode.EDIT:
        return this.isAccountComplete() && this.isAccountChanged();
      case AccountFormMode.SEARCH:
        return this.data.defaultData && this.data.defaultData.account
          ? this.isSelectionChanged()
          : this.isSelectionComplete();
      case AccountFormMode.CREATE_OR_SEARCH:
        return this.viewForm
          ? this.isAccountComplete()
          : this.isSelectionComplete();
      default:
        return false;
    }
  }

  suggestCommercial() {
    of(this.accountForm.getRawValue().commercial).pipe(debounceTime(300)).subscribe((search) => {
      if (search) {
        this.searchCommercial(search);
      }
    });
  }

  onTypeChange() {
    if ( this.accountForm.getRawValue().accountType !== this.proType ) {
      this.accountForm.get('siren').setValidators([]);
      this.accountForm.get('corporateName').setValidators([]);
      this.accountForm.get('name').setValidators([]);
    } else {
      this.accountForm.get('siren').setValidators([Validators.required]);
      this.accountForm.get('corporateName').setValidators([Validators.required]);
      this.accountForm.get('name').setValidators([Validators.required]);
    }
  }

  save(contact?: PeopleWithRole) {
    this.currentData.account.commercial = this.selectedCommercial;
    switch (this.data.mode) {
      case AccountFormMode.CREATE:
        if (!this.currentData.account.uuid) {
          this.addAccountWithContact(contact);
        } else {
          this.updateAccount();
        }
        break;
      case AccountFormMode.EDIT:
        this.updateAccount();
        break;
      case AccountFormMode.SEARCH:
        this.validate();
        break;
      case AccountFormMode.CREATE_OR_SEARCH:
        if (!!this.currentData.account.uuid) {
          this.validate();
        } else {
          this.addAccountWithContact(contact);
        }
        break;
      default:
        break;
    }
  }

  suggest(text: string) {
    if (text && text.length > 1) {
      this.accountsService.suggestClients(text).subscribe((results) => {
        this.suggestedAccount = results;
        if (this.data.onlyActivatedAccount) {
          this.suggestedAccount = this.suggestedAccount.filter(account => +account.state === AccountStatus.VALID);
        }
        if (this.data.forceType) {
          this.suggestedAccount = this.suggestedAccount.filter(account => account.type === this.data.forceType);
        }
      });
    } else {
      this.suggestedAccount = [];
    }
  }

  selectCommercial(evt: MatAutocompleteSelectedEvent) {
    this.selectedCommercial = evt.option.value;
    this.accountForm.get('commercial').setValue(this.getName(this.selectedCommercial));
  }

  searchCommercial(text: string) {
    if (text && text.length > 1) {
      this.usersService.searchUser(text).subscribe((results) => {
        this.commercials = results.map(user => User.fromData(user));
      });
    } else {
      this.commercials = [];
    }
  }

  isDisabled() {
    if ((this.data.mode === AccountFormMode.CREATE || this.data.mode === AccountFormMode.CREATE_OR_SEARCH) && !this.searchLoading) {
      if (this.currentData.account.type === AccountType.PROFESSIONAL && this.entity.siren && this.entity.siren.length === 9) {
        if (this.entity.siren !== this.lastSiren) {
          this.updateSirenValidity();
        }
        return this.isSirenUnique ? !this.isComplete() : true;
      } else if (this.currentData.account.type === AccountType.INDIVIDUAL) {
        this.isSirenUnique = true;
        return !this.isComplete();
      } else {
        return true;
      }
    } else {
      return !this.data.defaultData;
    }
  }

  updateSirenValidity() {
    this.searchLoading = true;
    this.lastSiren = JSON.parse(JSON.stringify(this.entity.siren));
    return this.entitiesService.getFromSiren(this.entity.siren).subscribe((resp) => {
      this.searchLoading = false;
      if (resp && resp.uuid) {
        this.isSirenUnique = false;
        this.infoService.displayError('Le numéro SIREN est déjà connu.');
      } else {
        this.isSirenUnique = true;
      }
    });
  }

  isAccountComplete() {
    return ((!this.data.roles || this.currentData.role) && this.isSirenUnique && this.currentData.account.type
      && this.currentData.account.category && this.selectedCommercial && this.selectedCommercial.login
      && (this.currentData.account.type !== AccountType.PROFESSIONAL
        || (this.entity.siren && this.entity.siren.length === 9 && this.entity.name && this.entity.corporateName)));
  }

  isAccountChanged() {
    const groups = this.currentData.account.groups && this.currentData.account.groups.length ? this.currentData.account.groups.sort().join('') : '';
    const defaultGroups = this.data.defaultData.account.groups && this.data.defaultData.account.groups.length ? this.data.defaultData.account.groups.sort().join('') : '';
    return ((this.data.roles && this.currentData.role !== this.data.defaultData.role) || (this.selectedCommercial && this.selectedCommercial.login !== this.data.defaultData.account.commercial.login)
      || this.currentData.account.category !== this.data.defaultData.account.category || this.currentData.account.maxPaymentTime !== this.data.defaultData.account.maxPaymentTime
      || this.currentData.account.importance !== this.data.defaultData.account.importance || groups !== defaultGroups);
  }

  isSelectionComplete() {
    return (!this.data.roles || this.currentData.role) && this.currentData.account && this.currentData.account.uuid;
  }

  isSelectionChanged() {
    return (!this.data.roles || this.currentData.role !== this.data.defaultData.role)
      && this.currentData.account && this.currentData.account.uuid !== this.data.defaultData.account.uuid;
  }

  addAccountWithContact(contact: PeopleWithRole) {
    this.currentData.account.contact = PeopleUtils.buildPeople(contact.people);
    this.currentData.account.type = this.accountForm.getRawValue().accountType;
    if (this.currentData.account.type === AccountType.PROFESSIONAL) {
      this.saving = true;
      this.entity.corporateName = this.accountForm.getRawValue().corporateName;
      this.entity.name = this.accountForm.getRawValue().name;
      this.entity.siren = this.accountForm.getRawValue().siren;
      this.entitiesService.add(this.entity).subscribe((newUuid) => {
        if (!newUuid || !newUuid.uuid) {
          console.log("An error occurred while adding new entity");
          setTimeout(() => this.saving = false);
        } else {
          this.entity.uuid = newUuid.uuid;
          this.currentData.account.entity = this.entity;
          this.currentData.account.reference = this.entity.siren;
          this.currentData.account.state = AccountStatus.INVALID;
          this.addAccount();
        }
      });
    } else {
      this.currentData.account.reference = 'privateAccountReference'; // TODO
      this.currentData.account.state = AccountStatus.VALID;
      this.addAccount();
    }
  }

  addAccount() {
    this.saving = true;
    this.currentData.account.category = this.accountForm.getRawValue().category;
    this.accountsService.add(this.currentData.account).subscribe((newUuid) => {
      if (!newUuid || !newUuid.uuid) {
        console.log("An error occurred while adding new account");
      } else {
        this.currentData.account.uuid = newUuid.uuid;
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  updateAccount() {
    this.saving = true;
    this.currentData.account.category = this.accountForm.getRawValue().category;
    this.currentData.account.importance = this.accountForm.getRawValue().importance;
    this.currentData.account.groups = this.accountForm.getRawValue().groups;
    this.accountsService.update(this.currentData.account).subscribe((updatedAccount) => {
      if (!updatedAccount) {
        console.log("An error occurred while adding new account");
      } else {
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = AccountUtils.buildAccountWithRole(this.currentData.account, this.accountForm.getRawValue().role);
    this.accountSaved.emit(AccountUtils.buildAccountWithRole(this.currentData.account, this.accountForm.getRawValue().role));
  }

  delete(account: AccountWithRole) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeAccount.emit(account);
      }
    });
  }

  updateEntity(entity: Entity) {
    this.editEntity = false;
    this.currentData.account.entity = entity;
  }

  getAccountName(account: Account) {
    return AccountUtils.getName(account);
  }

  getStatusName(key: number | string) {
    return AccountUtils.getStatusName(key);
  }

  cancel() {
    this.editEntity = false;
    this.initialize();
    this.cancelAction.emit();
  }

  changeMode() {
    this.initialize();
    this.viewForm = !this.viewForm;
    this.search.setValue(undefined);
  }

  back() {
    this.stepper.previous();
  }

  next() {
    this.stepper.next();
  }

  getName(commercial: User) {
    return commercial ? commercial.last_name.toUpperCase() + ' ' + commercial.first_name : '';
  }
}

export interface AccountFormData {
  mode: AccountFormMode | string; // Display mode
  disabled?: boolean;             // Disable fields
  disabledRole?: boolean;         // Disable role field
  deletable?: boolean;            // Show delete button
  inStep?: boolean;               // If displayed in another stepper
  roles?: string[];               // List of available roles
  forceType?: AccountType;        // Default account type
  defaultData?: AccountWithRole;  // Default data
  showEntity?: boolean;           // Show entity as disabled
  accessDetail?: boolean;         // Show link access button
  onlyActivatedAccount?: boolean; // Only show activated account
}

export enum AccountFormMode {
  CREATE = 'create',
  EDIT = 'edit',
  SEARCH = 'search',
  CREATE_OR_SEARCH = 'create_or_search'
}
