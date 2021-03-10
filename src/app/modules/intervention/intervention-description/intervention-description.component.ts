import {Component, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {LockService} from '../../../services/front/lock.service';
import {InfoService} from '../../../services/front/info.service';
import {Subscription} from 'rxjs';
import {DraftIntervention, InterventionParameters, InterventionsService, MaterializedIntervention
} from '../../../services/backend/interventions.service';
import {Estate, Premises} from '../../../services/backend/estates.service';
import {InterventionAccess, InterventionPeopleRole} from '../../utils/intervention-utils';
import {People, PeopleWithRole} from "../../../services/backend/people.service";
import {PeopleUtils} from "../../utils/people-utils";
import {MatDialog} from "@angular/material/dialog";
import {mergeMap} from "rxjs/operators";
import {shortcuts} from '../../../services/backend/technical-act.service';
import {Prestation, PrestationEstateType} from "../../../services/backend/prestations.service";
import {EstateUtils} from "../../utils/estate-utils";
import {ReportDestination, ReportDestinationDisplay} from "../../../services/backend/orders.service";

@Component({
  selector: 'app-intervention-description',
  templateUrl: './intervention-description.component.html',
  styleUrls: ['./intervention-description.component.scss']
})
export class InterventionDescriptionComponent implements OnInit {

  @Input() data: InterventionEstateData;
  @Input() disabled: boolean;

  @Output() interventionChanges: EventEmitter<MaterializedIntervention> = new EventEmitter();

  formGroup: FormGroup;
  contactRoles: string[] = Object.values(InterventionPeopleRole);
  accessConditions = Object.values(InterventionAccess);
  protected interventionParams: InterventionParameters;

  isLoading = new EventEmitter<boolean>();
  isPrestationContainsRaat: boolean;
  showAddContact = false;
  isNewForm = false;
  saving = false;

  constructor(protected lockService: LockService,
              protected interventionService: InterventionsService,
              protected renderer: Renderer2,
              protected infoService: InfoService,
              public dialog: MatDialog) {
  }

  ngOnInit(): void {
    const settled = this.data.intervention.asSettled();
    if (settled) {
      this.interventionParams = settled.parameters;
    } else {
      this.isNewForm = true;
      this.interventionParams = {
        workDescription: this.data.workDescription,
        contacts: []
      };
    }
    this.isPrestationContainsRaat = !!this.data.intervention.asCreated().prestations.find(p => p.technicalAct.shortcut === shortcuts.RAAT);
    this.formGroup = this.buildForm(this.interventionParams, this.isDisabled());
    this.showAddContact = !this.data.contacts || this.data.contacts.length === 0;
  }

  protected isDisabled() {
    return this.disabled || !(this.data.intervention.isDraft || this.data.intervention.isCreated || this.data.intervention.isSettled || this.data.intervention.isToSchedule);
  }

  /* Upload intervention informations */
  doSaveEstate() {
    this.saving = true;
    this.isLoading.emit(true);
    this.interventionParams = this.buildInterventionParams(this.formGroup);
    this.interventionService.setParameters(this.data.intervention.id, this.interventionParams).subscribe((partialInterventionUseless) => {
      // TODO fix interventionService.setParameters returns
      this.interventionService.getOne(this.data.intervention.id).subscribe((intervention) => {
        const prestations: Prestation[] = intervention.asCreated().prestations;
        if (this.data.contacts.length === 0 && prestations[0].estateType === PrestationEstateType.PREMISES) {
          const premises: Premises = EstateUtils.getPremisesFromId(this.data.estate, prestations[0].targetId);
          if (!!premises.contact) {
            this.interventionService.addInterventionPeople(intervention.id, premises.contact.uuid, InterventionPeopleRole.TENANT).subscribe((done) => {
              this.data.contacts.push({people: premises.contact, role: InterventionPeopleRole.TENANT});
              this.updateForm(intervention);
              this.showAddContact = false;
            });
          } else {
            this.updateForm(intervention);
          }
        } else {
          this.updateForm(intervention);
        }
      });
    });
  }

  updateForm(intervention: MaterializedIntervention) {
    this.data.intervention = intervention.asDraft();

    // Notify changes
    this.interventionChanges.emit(intervention);

    this.formGroup.markAsPristine();
    this.subscribeFormGroupEvents(this.formGroup);
    this.isNewForm = false;
    this.saving = false;
    this.isLoading.emit(false);
    this.lockService.unlock();
    this.infoService.displaySaveSuccess();
  }

  doCancel() {
    this.formGroup = this.buildForm(this.interventionParams, this.isDisabled());
    this.subscribeFormGroupEvents(this.formGroup);
    this.lockService.unlock();
  }

  setFocus() { // TODO check if this still work
    if (this.formGroup.get('otherContactType').value === '' || this.formGroup.get('otherContactType').value === null) {
      this.renderer.selectRootElement('#otherContactType').focus();
    }
  }

  showInfoMessage(type: InterventionPeopleRole) {
    if (type === InterventionPeopleRole.OTHER) {
      this.infoService.displayInfo('Veuillez renseigner le champs "Type de contact"');
    }
  }

  protected subscribeFormGroupEvents(formGroup: FormGroup): Subscription {
    return formGroup.valueChanges.subscribe(result => {
      this.lockService.lock();
    });
  }

  protected buildInterventionParams(formGroup: FormGroup): InterventionParameters {
    return {
      accessConditions: formGroup.get('accessConditions').value,
      accessDetails: formGroup.get('accessDetails').value,
      workDescription: formGroup.get('workDescription').value,
      contacts: [] // unused during update
    };
  }

  protected buildForm(interventionParams: InterventionParameters, disabled: boolean): FormGroup {

    return new FormGroup({
      accessConditions: new FormControl({value: interventionParams.accessConditions, disabled: disabled}),
      accessDetails: new FormControl({value: interventionParams.accessDetails, disabled: disabled}),
      workDescription: new FormControl({value: interventionParams.workDescription, disabled: disabled})
    });
  }

  getContactName(people: People) {
    return PeopleUtils.getName(people);
  }

  addContact(contact: PeopleWithRole) {
    this.interventionService.addInterventionPeople(this.data.intervention.id, contact.people.uuid, contact.role).subscribe((done) => {
      if (done) {
        this.data.contacts.push(contact);
        this.infoService.displaySaveSuccess();
      }
    });
  }

  updateContact(old: PeopleWithRole, updated: PeopleWithRole) {
    if (old.role !== updated.role) {
      this.interventionService.removeInterventionPeople(this.data.intervention.id, old.people.uuid)
        .pipe(mergeMap((done) => this.interventionService.addInterventionPeople(this.data.intervention.id, updated.people.uuid, updated.role)))
        .subscribe((done) => {
          if (done) {
            this.data.contacts = this.data.contacts.filter(pwr => pwr.people.uuid !== old.people.uuid);
            this.data.contacts.push(updated);
            this.infoService.displaySaveSuccess();
          }
      });
    } else {
      this.infoService.displaySaveSuccess();
    }
  }

  removeContact(contact: PeopleWithRole) {
    this.interventionService.removeInterventionPeople(this.data.intervention.id, contact.people.uuid).subscribe((done) => {
      this.data.contacts = this.data.contacts.filter(pwr => pwr.people.uuid !== contact.people.uuid);
      this.infoService.displaySaveSuccess();
    });
  }

  getDestinationName(destination: ReportDestination) {
    return (new ReportDestinationDisplay(destination)).display();
  }
}

export interface InterventionEstateData {
  estate: Estate;
  intervention: DraftIntervention;
  workDescription: string;
  contacts: PeopleWithRole[];
  reportDestinations: ReportDestination[];
}
