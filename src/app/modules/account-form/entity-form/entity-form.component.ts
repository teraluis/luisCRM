import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {EntitiesService, Entity, EntityDomain, EntityType} from "../../../services/backend/entities.service";
import {AccountUtils} from "../../utils/account-utils";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-entity-form',
  templateUrl: './entity-form.component.html'
})
export class EntityFormComponent implements OnInit {

  @Input() data: EntityFormData;

  @Output() entitySaved = new EventEmitter<Entity>();
  @Output() cancelAction = new EventEmitter<void>();

  entity: Entity;
  corporationTypes = Object.values(EntityType);
  corporationDomains = Object.values(EntityDomain);
  saving = false;

  entityForm: FormGroup;

  constructor(private entitiesService: EntitiesService,
              private fb: FormBuilder) {
  }

  ngOnInit() {
    this.entity = AccountUtils.buildEntity(this.data.defaultData);
    this.entityForm = this.fb.group({
      name: [{value: this.entity.name, disabled: this.data.disabled}, Validators.required],
      description: [{value: this.entity.description, disabled: this.data.disabled}],
      domain: [{value: this.entity.domain, disabled: this.data.disabled}],
      type: [{value: this.entity.type, disabled: this.data.disabled}],
      corporateName: [{value: this.entity.corporateName, disabled: true}, Validators.required],
      siren: [{value: this.entity.siren, disabled: true}, Validators.required]
    });
  }

  saveEntity() {
    this.saving = true;
    const rawValue = this.entityForm.getRawValue();
    this.entity.name = rawValue.name;
    this.entity.description = rawValue.description;
    this.entity.domain = rawValue.domain;
    this.entity.type = rawValue.type;
    this.entity.corporateName = rawValue.corporateName;
    this.entity.siren = rawValue.siren;
    this.entitiesService.update(this.entity).subscribe((entity) => {
      if (!entity) {
        this.entity = AccountUtils.buildEntity(this.data.defaultData);
        console.log('An error occurred while updating ', this.entity.uuid);
      } else {
        this.data.defaultData = AccountUtils.buildEntity(entity);
        this.entitySaved.emit(entity);
      }
      setTimeout(() => this.saving = false);
    });
  }

  isEntityChanged() {
    return this.entity && this.data.defaultData && (this.entity.name !== this.data.defaultData.name
      || (this.entity.type && !this.data.defaultData || this.entity.type !== this.data.defaultData.type)
      || (this.entity.domain && !this.data.defaultData || this.entity.domain !== this.data.defaultData.domain)
      || (this.entity.description && !this.data.defaultData || this.entity.description !== this.data.defaultData.description));
  }

  cancel() {
    this.entity = AccountUtils.buildEntity(this.data.defaultData);
    this.cancelAction.emit();
  }
}

// Creation of Entity is handled by AccountFormComponent
export interface EntityFormData {
  disabled: boolean;    // Disable fields
  defaultData: Entity;  // Default data
}
