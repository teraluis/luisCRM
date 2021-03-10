import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AgencyService, IAgency} from '../../services/backend/agency.service';
import {User, UsersService} from '../../services/backend/users.service';
import {debounceTime, distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {entityValidator, validateIban} from '../../core/validators';
import {IOffice, OfficeService} from "../../services/backend/office.service";
import {MatAutocomplete} from "@angular/material";

@Component({
  selector: 'app-agency-form',
  templateUrl: './agency-form.component.html'
})
export class AgencyFormComponent implements OnInit {

  @Input() data: AgencyFormData;

  @Output() agencySaved = new EventEmitter<IAgency>();
  @Output() cancelAction = new EventEmitter<void>();

  isLoading = false;
  agencyForm: FormGroup;
  suggestedUser: User[] = [];
  saving = false;

  filteredOfficies: IOffice[] = [];
  selectedOfficies: IOffice[] = [];

  @ViewChild('officeInput') officeInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoffice') matAutocomplete: MatAutocomplete;

  constructor(private fb: FormBuilder,
              private agencyService: AgencyService,
              private officeService: OfficeService,
              private userService: UsersService) {
  }

  ngOnInit(): void {
    this.initialize();
    this.agencyForm.get('manager').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v && v.length > 1),
        switchMap(val => this.userService.searchUser(val)),
        map(users => users.map(user => User.fromData(user)))
      )
      .subscribe(users => {
        this.suggestedUser = users;
      });

    this.agencyForm.get('officies').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v && v.length > 0),
        switchMap(val => this.officeService.search(val)),
        map(users => users.map(office => office))
      )
      .subscribe(officies => {
        this.filteredOfficies = officies.filter(officeFilter => this.selectedOfficies.filter(o => o.name === officeFilter.name).length === 0);
      });
  }

  initialize() {
    switch (this.data.mode) {
      case AgencyFormMode.CREATE:
        this.agencyForm = this.fb.group({
          code: ['', Validators.required],
          name: ['', Validators.required],
          manager: ['', [Validators.required, entityValidator(User)]],
          referenceIban: ['', [Validators.required, validateIban()]],
          referenceBic: ['', [Validators.required]],
          officies: ['']
        });
        this.selectedOfficies = [];
        break;
      case AgencyFormMode.EDIT:
        this.agencyForm = this.fb.group({
          code: [{value: this.data.defaultData.code, disabled: this.data.disabled}, Validators.required],
          name: [{value: this.data.defaultData.name, disabled: this.data.disabled}, Validators.required],
          referenceIban: [{value: this.data.defaultData.referenceIban, disabled: this.data.disabled}, [Validators.required, validateIban()]],
          referenceBic: [{value: this.data.defaultData.referenceBic, disabled: this.data.disabled}, [Validators.required]],
          manager: [{value: this.data.defaultData.manager, disabled: this.data.disabled}, [Validators.required, entityValidator(User)]],
          officies: [{value: '', disabled: this.data.disabled}]
        });
        this.selectedOfficies = this.data.defaultData.officies;
        break;
      default:
        this.agencyForm = this.fb.group({code: '', name: '', manager: '', referenceIban: '', referenceBic: '', officies: ''});
        this.selectedOfficies = [];
        this.cancelAction.emit();
        break;
    }
  }

  save() {
    switch (this.data.mode) {
      case AgencyFormMode.CREATE:
        this.saving = true;
        const date = new Date().getTime();
        this.agencyService.add({
          ...this.agencyForm.value,
          created: date
        }).subscribe((newUuid) => {
          const agency: IAgency = {
            created: date,
            code: this.agencyForm.get('code').value,
            manager: this.agencyForm.get('manager').value,
            name: this.agencyForm.get('name').value,
            referenceIban: this.agencyForm.get('referenceIban').value,
            referenceBic: this.agencyForm.get('referenceBic').value,
            uuid: newUuid.uuid
          };
          this.updateOffices(agency);
        });
        break;
      case AgencyFormMode.EDIT:
        this.saving = true;
        this.agencyService.update({
          ...this.agencyForm.value,
          uuid: this.data.defaultData.uuid
        }).subscribe((updated) => {
          this.updateOffices(updated);
        });
        break;
      default:
        break;
    }
  }

  updateOffices(agency) {
    if ( this.selectedOfficies.length > 0 ) {
      let index = 0;
      this.selectedOfficies.forEach(office => {
        office.agency = agency.uuid;
        this.officeService.update(office).subscribe(updated => {
          index++;
          if ( index === this.selectedOfficies.length) {
            this.agencySaved.emit(agency);
            setTimeout(() => this.saving = false);
          }
        });
      });
    } else {
      this.agencySaved.emit(agency);
      setTimeout(() => this.saving = false);
    }
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }

  addOffice(event) {
    if (event.option) {
      this.selectedOfficies.push(event.option.value);
      this.officeInput.nativeElement.value = '';
    }

    this.agencyForm.get('officies').setValue(null);
  }
}

export interface AgencyFormData {
  mode: AgencyFormMode | string;  // Display mode
  disabled?: boolean;             // Disable fields
  deletable?: boolean;            // Show delete button
  defaultData?: IAgency;          // Default data
}

export enum AgencyFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
