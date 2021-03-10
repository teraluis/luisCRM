import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {User, UsersService, UserWithRole} from '../../services/backend/users.service';
import {entityValidator} from '../../core/validators/entity-validator.directive';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationComponent} from '../confirmation/confirmation.component';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {

  @Input() data: UserFormData;

  @Output() userSaved = new EventEmitter<UserWithRole>();
  @Output() removeUser = new EventEmitter<UserWithRole>();
  @Output() cancelAction = new EventEmitter<void>();

  currentData: UserWithRole;
  marketUserForm: FormGroup;
  suggestedUsers: User[] = [];

  constructor(private fb: FormBuilder,
              public dialog: MatDialog,
              private userService: UsersService) {
  }

  ngOnInit() {
    this.initialize();
    if (this.data.disableUser) {
      this.marketUserForm.get('user').disable();
    }
    this.marketUserForm.get('user').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(val => this.userService.searchUser(val)),
        map(users => users.map(user => User.fromData(user)))
      )
      .subscribe((users: User[]) => {
        this.suggestedUsers = users;
      });
  }

  initialize() {
    switch (this.data.mode) {
      case UserFormMode.SEARCH:
        this.currentData = this.data.defaultData && this.data.defaultData.user
          ? User.buildUserWithRole(User.fromData(this.data.defaultData.user), this.data.defaultData.role)
          : User.buildUserWithRole(User.fromData({login: undefined, first_name: '', last_name: '', description: ''}));
        this.marketUserForm = this.fb.group({
          user: [{
            value: this.currentData.user ? this.currentData.user : '',
            disabled: this.data.disabled
          }, [Validators.required, entityValidator(User)]],
          role: [{
            value: this.data.defaultData && this.data.defaultData.role ? this.data.defaultData.role : '',
            disabled: this.data.disabled || this.data.disabledRole
          }, Validators.required]
        });
        break;
      case UserFormMode.CREATE:
      // Not implemented yet
      case UserFormMode.EDIT:
      // Not implemented yet
      default:
        this.currentData = User.buildUserWithRole(User.fromData({login: '', first_name: '', last_name: '', description: ''}));
        this.marketUserForm = this.fb.group({user: [{value: '', disabled: true}], role: [{value: '', disabled: true}]});
        this.cancelAction.emit();
        break;
    }
  }

  save() {
    switch (this.data.mode) {
      case UserFormMode.SEARCH:
        this.validate();
        break;
      case UserFormMode.CREATE:
      // Not implemented yet
      case UserFormMode.EDIT:
      // Not implemented yet
      default:
        break;
    }
  }

  validate() {
    this.data.defaultData = User.buildUserWithRole(this.marketUserForm.getRawValue().user, this.marketUserForm.getRawValue().role);
    this.userSaved.emit(User.buildUserWithRole(this.marketUserForm.getRawValue().user, this.marketUserForm.getRawValue().role));
  }

  delete() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeUser.emit(User.buildUserWithRole(this.marketUserForm.getRawValue().user, this.marketUserForm.getRawValue().role));
      }
    });
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }
}

export interface UserFormData {
  mode: UserFormMode | string;  // Display mode
  disabled?: boolean;           // Disable fields
  disabledRole?: boolean;         // Disable role field
  disableUser?: boolean;        // Disable user field
  deletable?: boolean;          // Show delete button
  inStep?: boolean;             // If displayed in another stepper
  roles?: string[];             // List of available roles
  defaultData?: UserWithRole;   // Default data
}

export enum UserFormMode {
  CREATE = 'create',
  EDIT = 'edit',
  SEARCH = 'search'
}
