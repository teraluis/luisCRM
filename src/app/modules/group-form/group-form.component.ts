import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {GroupCategory, GroupService, GroupType, IGroup} from "../../services/backend/group.service";
import {validateIban} from "../../core/validators/iban-validator.directive";

@Component({
  selector: 'app-group-form',
  templateUrl: 'group-form.component.html',
  styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {

  @Input() data: GroupFormData;

  @Output() groupSaved = new EventEmitter<IGroup>();
  @Output() cancelAction = new EventEmitter<void>();

  isLoading = false;
  groupFrom: FormGroup;
  types = Object.values(GroupType);
  categories = Object.values(GroupCategory);
  saving = false;

  constructor(private fb: FormBuilder,
              private groupService: GroupService) {
  }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    switch (this.data.mode) {
      case GroupFormMode.CREATE:
        this.groupFrom = this.fb.group({
          name: ['', Validators.required],
          type: ['', Validators.required],
          category: '',
          iban: ['', validateIban()],
          description: ''
        });
        break;
      case GroupFormMode.EDIT:
        this.groupFrom = this.fb.group({
          name: [{value: this.data.defaultData.name, disabled: this.data.disabled}, Validators.required],
          type: [{value: this.data.defaultData.type, disabled: this.data.disabled}, Validators.required],
          category: [{value: this.data.defaultData.category, disabled: this.data.disabled}],
          iban: [{value: this.data.defaultData.iban, disabled: this.data.disabled}, validateIban()],
          description: [{value: this.data.defaultData.description, disabled: this.data.disabled}]
        });
        break;
      default:
        this.groupFrom = this.fb.group({name: '', type: '', category: '', iban: '', description: ''});
        this.cancelAction.emit();
        break;
    }
  }

  save() {
    const date = new Date().getTime();
    switch (this.data.mode) {
      case GroupFormMode.CREATE:
        this.saving = true;
        this.groupService.add({
          ...this.groupFrom.value,
          created: date
        }).subscribe((newUuid) => {
          const group: IGroup = {
            created: date,
            name: this.groupFrom.get('name').value,
            type: this.groupFrom.get('type').value,
            category: this.groupFrom.get('category').value,
            iban: this.groupFrom.get('iban').value,
            description: this.groupFrom.get('description').value,
            uuid: newUuid.uuid
          };
          this.groupSaved.emit(group);
          setTimeout(() => this.saving = false);
        });
        break;
      case GroupFormMode.EDIT:
        this.saving = true;
        this.groupService.add({
          ...this.groupFrom.value,
          created: date
        }).subscribe((newUuid) => {
          const group: IGroup = {
            created: date,
            name: this.groupFrom.get('name').value,
            type: this.groupFrom.get('type').value,
            category: this.groupFrom.get('category').value,
            iban: this.groupFrom.get('iban').value,
            description: this.groupFrom.get('description').value,
            uuid: newUuid.uuid
          };
          this.groupSaved.emit(group);
          setTimeout(() => this.saving = false);
        });
        break;
      default:
        break;
    }
  }

  cancel() {
    this.initialize();
    this.cancelAction.emit();
  }
}

export interface GroupFormData {
  mode: GroupFormMode | string; // Display mode
  disabled?: boolean;           // Disable fields
  deletable?: boolean;          // Show delete button
  defaultData?: IGroup;         // Default data
}

export enum GroupFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
