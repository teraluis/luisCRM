import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivityService, IActivity} from "../../services/backend/activity.service";

@Component({
  selector: 'app-activity-form',
  templateUrl: 'activity-form.component.html'
})
export class ActivityFormComponent implements OnInit {

  @Input() data: ActivityFormData;

  @Output() activitySaved = new EventEmitter<IActivity>();
  @Output() cancelAction = new EventEmitter<void>();

  activityForm: FormGroup;
  saving = false;

  constructor(private fb: FormBuilder,
              private activityService: ActivityService) {
  }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    switch (this.data.mode) {
      case ActivityFormMode.CREATE:
        this.activityForm = this.fb.group({
          name: ['', Validators.required],
          description: ''
        });
        break;
      case ActivityFormMode.EDIT:
        this.activityForm = this.fb.group({
          name: [{value: this.data.defaultData.name, disabled: this.data.disabled}, Validators.required],
          description: [{value: this.data.defaultData.description, disabled: this.data.disabled}]
        });
        break;
      default:
        this.activityForm = this.fb.group({name: '', description: ''});
        this.cancelAction.emit();
        break;
    }
  }

  save() {
    switch (this.data.mode) {
      case ActivityFormMode.CREATE:
        this.saving = true;
        const date = new Date().getTime();
        this.activityService.add({
          ...this.activityForm.value,
          created: date
        }).subscribe((newUuid) => {
          const activity: IActivity = {
            created: date,
            description: this.activityForm.get('description').value,
            name: this.activityForm.get('name').value,
            uuid: newUuid.uuid
          };
          this.activitySaved.emit(activity);
          setTimeout(() => this.saving = false);
        });
        break;
      case ActivityFormMode.EDIT:
        this.saving = true;
        this.activityService.update({
          ...this.activityForm.value,
          uuid: this.data.defaultData.uuid
        }).subscribe((resp) => {
          this.activitySaved.emit(resp);
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

export interface ActivityFormData {
  mode: ActivityFormMode | string;  // Display mode
  disabled?: boolean;               // Disable fields
  defaultData?: IActivity;          // Default data
}

export enum ActivityFormMode {
  CREATE = 'create',
  EDIT = 'edit'
}
