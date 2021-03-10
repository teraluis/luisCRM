import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {People, PeopleService, PeopleWithRole} from '../../services/backend/people.service';
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import {PeopleUtils} from '../utils/people-utils';
import {EstablishmentPeopleRole} from "../../services/backend/establishments.service";

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit {

  @Input() data: ContactFormData;

  @Output() contactSaved = new EventEmitter<PeopleWithRole>();
  @Output() removeContact = new EventEmitter<PeopleWithRole>();
  @Output() cancelAction = new EventEmitter<void>();

  contactForm: FormGroup;

  currentData: PeopleWithRole;
  viewForm: boolean;
  searchField: string;
  search: FormControl;
  suggestedPeople: People[];
  saving = false;
  mode = {
    CREATE: ContactFormMode.CREATE,
    EDIT: ContactFormMode.EDIT,
    SEARCH: ContactFormMode.SEARCH,
    CREATE_OR_SEARCH: ContactFormMode.CREATE_OR_SEARCH
  };

  constructor(private peopleService: PeopleService,
              private fb: FormBuilder,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.viewForm = this.data.mode === ContactFormMode.CREATE || this.data.mode === ContactFormMode.EDIT;
    this.initialize();
    this.search = new FormControl({value: this.searchField, disabled: this.data.disabled});
    this.search.valueChanges.pipe(debounceTime(500))
      .subscribe((res) => this.suggest(res));
  }

  initialize() {
    switch (this.data.mode) {
      case ContactFormMode.CREATE:
        this.currentData = this.data.defaultData
          ? PeopleUtils.buildPeopleWithRole(PeopleUtils.duplicate(this.data.defaultData.people), this.data.defaultData.role)
          : PeopleUtils.buildPeopleWithRole();
        break;
      case ContactFormMode.EDIT:
        this.currentData = PeopleUtils.buildPeopleWithRole(this.data.defaultData.people, this.data.defaultData.role);
        break;
      case ContactFormMode.SEARCH:
        this.currentData = this.data.defaultData
          ? PeopleUtils.buildPeopleWithRole(this.data.defaultData.people, this.data.defaultData.role)
          : PeopleUtils.buildPeopleWithRole();
        this.searchField = this.currentData.people && this.currentData.people.uuid ? PeopleUtils.getName(this.currentData.people) : '';
        break;
      case ContactFormMode.CREATE_OR_SEARCH:
        this.currentData = PeopleUtils.buildPeopleWithRole();
        break;
      default:
        this.currentData = PeopleUtils.buildPeopleWithRole();
        this.cancelAction.emit();
        break;
    }

    this.contactForm = this.fb.group({
      role: [{value: this.currentData.role, disabled: this.data.disabled || this.data.disabledRole}, this.data.roles ? Validators.required : []],
      title: [{value: this.currentData.people.title, disabled: this.data.disabled}, Validators.required],
      lastname: [{value: this.currentData.people.lastname, disabled: this.data.disabled}, Validators.required],
      firstname: [{value: this.currentData.people.firstname, disabled: this.data.disabled}],
      mobilePhone: [{value: this.currentData.people.mobilePhone, disabled: this.data.disabled}, Validators.required],
      jobDescription: [{value: this.currentData.people.jobDescription, disabled: this.data.disabled}],
      email: [{value: this.currentData.people.email, disabled: this.data.disabled}, this.isEmailRequired() ? Validators.required : []],
    });
  }

  isComplete() {
    switch (this.data.mode) {
      case ContactFormMode.CREATE:
        return this.isContactComplete();
      case ContactFormMode.EDIT:
        return this.isContactComplete() && this.isContactChanged();
      case ContactFormMode.SEARCH:
        return this.data.defaultData && this.data.defaultData.people
          ? this.isSelectionChanged()
          : this.isSelectionComplete();
      case ContactFormMode.CREATE_OR_SEARCH:
        return this.viewForm
          ? this.isContactComplete()
          : this.isSelectionComplete();
      default:
        return false;
    }
  }

  save() {
    switch (this.data.mode) {
      case ContactFormMode.CREATE:
        if (!this.currentData.people.uuid) {
          this.addContact();
        } else {
          this.updateContact();
        }
        break;
      case ContactFormMode.EDIT:
        this.updateContact();
        break;
      case ContactFormMode.SEARCH:
        this.validate();
        break;
      case ContactFormMode.CREATE_OR_SEARCH:
        if (!!this.currentData.people.uuid) {
          this.validate();
        } else {
          this.addContact();
        }
        break;
      default:
        break;
    }
  }

  suggest(text: string) {
    if (text && text.length > 0) {
      this.peopleService.suggestAll(text).subscribe((results) => {
        this.suggestedPeople = results.map((result) => result);
      });
    } else {
      this.suggestedPeople = [];
    }
  }

  isContactComplete() {
    return (!this.data.roles || this.currentData.role) && this.currentData.people.lastname
      && this.currentData.people.firstname && this.currentData.people.mobilePhone;
  }

  isContactChanged() {
    return (this.data.roles && this.currentData.role !== this.data.defaultData.role) || this.currentData.people.title !== this.data.defaultData.people.title
      || this.currentData.people.lastname !== this.data.defaultData.people.lastname || this.currentData.people.firstname !== this.data.defaultData.people.firstname
      || this.currentData.people.mobilePhone !== this.data.defaultData.people.mobilePhone || this.currentData.people.email !== this.data.defaultData.people.email
      || this.currentData.people.jobDescription !== this.data.defaultData.people.jobDescription;
  }

  isSelectionComplete() {
    return (!this.data.roles || this.currentData.role) && this.currentData.people && this.currentData.people.uuid;
  }

  isSelectionChanged() {
    return (this.data.roles && this.currentData.role !== this.data.defaultData.role)
      || this.currentData.people.uuid !== this.data.defaultData.people.uuid;
  }

  addContact() {
    this.saving = true;
    this.peopleService.add(this.contactForm.getRawValue()).subscribe((newUuid) => {
      if (!newUuid || !newUuid.uuid) {
        console.log('An error occurred while adding new people');
      } else {
        this.currentData.people = this.contactForm.getRawValue();
        this.currentData.people.uuid = newUuid.uuid;
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  updateContact() {
    this.saving = true;

    const people = this.contactForm.getRawValue();
    people.uuid = this.currentData.people.uuid;

    this.peopleService.update(people).subscribe((updatedPeople) => {
      if (!updatedPeople) {
        console.log('An error occurred while updating people ' + this.currentData.people.uuid);
      } else {
        this.validate();
      }
      setTimeout(() => this.saving = false);
    });
  }

  validate() {
    this.data.defaultData = PeopleUtils.buildPeopleWithRole(this.currentData.people, this.contactForm.getRawValue().role);
    this.contactSaved.emit(PeopleUtils.buildPeopleWithRole(this.currentData.people, this.contactForm.getRawValue().role));
  }

  delete(contact: PeopleWithRole) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {title: 'Confirmation', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
      width: '40%'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeContact.emit(contact);
      }
    });
  }

  onSelectPeople(people: People) {
    this.contactForm.get("title").setValue(people.title);
    this.contactForm.get("lastname").setValue(people.lastname);
    this.contactForm.get("firstname").setValue(people.firstname);
    this.contactForm.get("email").setValue(people.email);
    this.contactForm.get("mobilePhone").setValue(people.mobilePhone);
    this.contactForm.get("jobDescription").setValue(people.jobDescription);

    this.currentData.people = this.contactForm.getRawValue();
    this.currentData.people.uuid = people.uuid;

    this.contactForm.markAsDirty();
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  getName(people: People) {
    return PeopleUtils.getName(people);
  }

  isEmailRequired() {
    return this.currentData.role === EstablishmentPeopleRole.MAIN; // TODO : revoir le terme ?
  }

  changeMode() {
    this.initialize();
    this.viewForm = !this.viewForm;
    this.search.setValue(undefined);
  }
}

export interface ContactFormData {
  mode: ContactFormMode | string; // Display mode
  disabled?: boolean;             // Disabled fields
  disabledRole?: boolean;         // Disable role field
  deletable?: boolean;            // Show delete button
  inStep?: boolean;               // If displayed in another stepper
  roles?: string[];               // List of available roles
  defaultData?: PeopleWithRole;   // Default data
}

export enum ContactFormMode {
  CREATE = 'create',
  EDIT = 'edit',
  SEARCH = 'search',
  CREATE_OR_SEARCH = 'create_or_search'
}
