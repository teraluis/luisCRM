import {Component, EventEmitter} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {
  CustomerRequirement,
  IMarket,
  Market,
  MarketEstablishmentRole,
  MarketAttachmentTypes,
  MarketComments,
  MarketPeople,
  MarketPeopleRole,
  MarketsService,
  MarketUser,
  MarketUserRole, MarketEstablishment
} from '../../services/backend/markets.service';
import {debounceTime, distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {PeopleService, PeopleWithRole} from '../../services/backend/people.service';
import {Agency, AgencyService, IAgency} from '../../services/backend/agency.service';
import {MatDialog} from '@angular/material/dialog';
import {Attachment, AttachmentType} from '../file-upload/file-upload.component';
import {PeopleUtils} from '../utils/people-utils';
import {ContactFormData, ContactFormMode} from '../contact-form/contact-form.component';
import {ContactFormDialogComponent} from '../contact-form/contact-form-dialog/contact-form-dialog.component';
import {InfoService} from '../../services/front/info.service';
import {UserFormData, UserFormMode} from '../user-form/user-form.component';
import {UserFormDialogComponent} from '../user-form/user-form-dialog/user-form-dialog.component';
import {UserWithRole} from '../../services/backend/users.service';
import {DataComment, sortComments} from '../events/events.component';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {AttachmentsService, IAttachment} from '../../services/backend/attachments.service';
import {EstablishmentWithRole, FacturationAnalysis} from '../../services/backend/establishments.service';
import {EstablishmentFormData, EstablishmentFormMode} from '../establishment-form/establishment-form.component';
import {EstablishmentFormDialogComponent} from '../establishment-form/establishment-form-dialog/establishment-form-dialog.component';

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html'
})
export class MarketComponent {

  isLoading = false;
  action = false;
  market: IMarket = new Market();
  marketForm: FormGroup;
  suggestedAgencies: IAgency[] = [];
  updateContacts = new EventEmitter<void>();
  updateAccounts = new EventEmitter<void>();
  updateUsers = new EventEmitter<void>();
  updateAttachmentList = new EventEmitter<void>();
  customRequirements = Object.values(CustomerRequirement);
  facturationAnalysis = Object.values(FacturationAnalysis);
  attachments: Attachment[];
  attachmentTypes: AttachmentType[];
  dataComment: DataComment[] = [];
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un contact interne',
      icon: 'add',
      function: () => this.createUser()
    },
    {
      label: 'Ajouter un établissement',
      icon: 'add',
      function: () => this.createAccount()
    },
    {
      label: 'Ajouter un contact externe',
      icon: 'add',
      function: () => this.createContact()
    }
  ];
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;
  ascending = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private marketService: MarketsService,
    private peopleService: PeopleService,
    private agencyService: AgencyService,
    private infoService: InfoService,
    protected dialog: MatDialog,
    protected attachmentService: AttachmentsService
  ) {
    this.getData();
    this.disabled = !this.userRights.accountManagement;
  }

  save() {
    this.marketService.update({...this.marketForm.getRawValue()}).subscribe((resp) => {
      if (resp) {
        this.infoService.displaySaveSuccess();
      }
      this.getData();
    });
  }

  getData() {
    this.isLoading = !this.market.uuid;
    this.route.params
      .pipe(switchMap(params => this.marketService.get(params.id)))
      .subscribe(res => {
        this.market = Market.fromData(res);
        this.initForm();
        this.buildAttachments();
        this.getComments();
        this.isLoading = false;
      });
  }

  private buildAttachments() {
    this.attachmentTypes = [{types: Object.values(MarketAttachmentTypes), objects: [{id: this.market.uuid, label: undefined}]}];
    this.attachments = [];
    this.attachmentService.getByEntityId(this.market.uuid).subscribe(attachments => {
        attachments.forEach(attachment => {
          this.attachments.push({
            file: undefined,
            fileName: attachment.filename,
            mandatory: attachments.length === 1,
            object: {id: attachment.uuid, label: undefined},
            type: attachment.attachmentType,
            uuid: attachment.uuid,
            author: attachment.user.login,
            created: attachment.created
          });
        });
      }
    );
    setTimeout(() => this.updateAttachmentList.emit());
  }

  getComments() {
    this.marketService.getAllComments(this.market.uuid).subscribe((comments) => {
      this.dataComment = [];
      comments.forEach((comment) => {
        this.dataComment.push({comment: comment.comment, user: comment.user, created: new Date(comment.created)});
      });
    });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  getClientAccountTotal() {
    return this.market.marketEstablishments ? this.market.marketEstablishments.filter(ma => ma.role === MarketEstablishmentRole.CLIENT).length : 0;
  }

  getKeyContact() {
    if (this.market.marketPeoples) {
      const marketPeople = this.market.marketPeoples.find(mp => mp.role === MarketPeopleRole.KEY);
      return marketPeople ? PeopleUtils.getName(marketPeople.people) : '';
    }
    return '';
  }

  private initForm(): void {
    this.marketForm = this.fb.group({
      name: [{value: this.market.name, disabled: this.disabled}, Validators.required],
      marketNumber: [{value: this.market.marketNumber, disabled: this.disabled}, Validators.required],
      agency: [{value: this.market.agency, disabled: this.disabled}, Validators.required],
      receiveDate: [{value: this.market.receiveDate, disabled: this.disabled}],
      responseDate: [{value: this.market.responseDate, disabled: this.disabled}],
      returnDate: [{value: this.market.returnDate, disabled: this.disabled}],
      startDate: [{value: this.market.startDate, disabled: this.disabled}],
      duration: [{value: this.market.duration, disabled: this.disabled}],
      publicationNumber: [{value: this.market.publicationNumber, disabled: this.disabled}],
      customerRequirement: [{value: this.market.customerRequirement, disabled: this.disabled}],
      origin: [{value: this.market.origin, disabled: this.disabled}],
      estimateVolume: [{value: this.market.estimateVolume, disabled: this.disabled}],
      missionOrderType: [{value: this.market.missionOrderType, disabled: this.disabled}],
      deadlineModality: [{value: this.market.deadlineModality, disabled: this.disabled}],
      dunningModality: [{value: this.market.dunningModality, disabled: this.disabled}],
      interventionCondition: [{value: this.market.interventionCondition, disabled: this.disabled}],
      specificReportNaming: [{value: this.market.specificReportNaming, disabled: this.disabled}],
      specificReportDisplay: [{value: this.market.specificReportDisplay, disabled: this.disabled}],
      specificBilling: [{value: this.market.specificBilling, disabled: this.disabled}],
      missionOrderBillingLink: [{value: this.market.missionOrderBillingLink, disabled: this.disabled}],
      billingFrequency: [{value: this.market.billingFrequency, disabled: this.disabled}],
      warningPoint: [{value: this.market.warningPoint, disabled: this.disabled}],
      description: [{value: this.market.description, disabled: this.disabled}],
      uuid: [{value: this.market.uuid, disabled: this.disabled}],
      tenant: [{value: this.market.tenant, disabled: this.disabled}],
      facturationAnalysis: [{value: this.market.facturationAnalysis ? this.market.facturationAnalysis : this.valueFacturationAnalysis(), disabled: this.disabled}]
    });

    this.autocomplete();
  }

  valueFacturationAnalysis() {
    let result = null;
    for (const establishment of this.market.marketEstablishments) {
      if (establishment.role === "Client" && establishment.establishment.facturationAnalysis !== null) {
        result = establishment.establishment.facturationAnalysis;
      }
    }
    return result;
  }

  private autocomplete(): void {
    this.marketForm.get('agency').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => v.length > 1),
        switchMap(val => this.agencyService.search(val) as unknown as Observable<IAgency[]>),
        map(agencies => agencies.map(agency => Agency.fromData(agency)))
      )
      .subscribe(agencies => {
        this.suggestedAgencies = agencies;
      });
  }

  uploadAttachment(attachment: Attachment) {
    const att: IAttachment = {
      vfk: this.market.uuid,
      filename: attachment.fileName,
      user: {
        login: localStorage.getItem('username')
      },
      attachmentType: this.getMarketType(attachment.type),
      attachedUuid: null
    };

    this.attachmentService.add(att, attachment.object.id, attachment.file, 'markets', this.market.uuid).subscribe(() => {
      this.getData();
    });
  }

  getMarketType(typeName: string) {
    let type: MarketAttachmentTypes;
    if (Object.values(MarketAttachmentTypes).some((col: string) => col === typeName)) {
      type = typeName as MarketAttachmentTypes;
    }
    return type;
  }

  downloadAttachment(attachment: Attachment) {
    this.attachmentService.getFile(this.market.uuid, attachment.fileName, 'markets').subscribe((blob) => {
      if (blob) {
        const data = window.URL.createObjectURL(blob);
        window.open(data, '_blank');
      }
    });
  }

  removeAttachment(attachment: Attachment) {
    if (attachment.type === MarketAttachmentTypes.BPU) {
      this.marketService.removeBpu(attachment.uuid).subscribe((res) => {
        this.getData();
      });
    }
  }

  createContact() {
    const data: ContactFormData = {
      mode: ContactFormMode.CREATE_OR_SEARCH,
      roles: Object.values(MarketPeopleRole)
    };
    const dialogRef = this.dialog.open(ContactFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((c: PeopleWithRole) => {
      if (c && c.people.uuid) {
        this.marketService.addContact(new MarketPeople(this.market, c.people, c.role)).subscribe((done) => {
          if (done) {
            this.infoService.displaySaveSuccess();
            this.updateContacts.emit();
          }
        });
      }
    });
  }

  createAccount() {
    const data: EstablishmentFormData = {
      mode: EstablishmentFormMode.SEARCH,
      roles: Object.values(MarketEstablishmentRole)
    };
    const dialogRef = this.dialog.open(EstablishmentFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((newEstablishment: EstablishmentWithRole) => {
      if (newEstablishment && newEstablishment.establishment.uuid) {
        this.marketService.addEstablishment(new MarketEstablishment(this.market, newEstablishment.establishment, newEstablishment.role)).subscribe((done) => {
          if (done) {
            this.infoService.displaySaveSuccess();
            this.updateAccounts.emit();
          }
        });
      }
    });
  }

  createUser() {
    const data: UserFormData = {
      mode: UserFormMode.SEARCH,
      roles: Object.values(MarketUserRole)
    };
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      data: data,
      width: '60%'
    });
    dialogRef.afterClosed().subscribe((newUser: UserWithRole) => {
      if (newUser && newUser.user.login) {
        this.marketService.addUser(new MarketUser(this.market, newUser.user, newUser.role)).subscribe((done) => {
          if (done) {
            this.infoService.displaySaveSuccess();
            this.updateUsers.emit();
          }
        });
      }
    });
  }

  saveComment(comment: DataComment) {
    const newComment: MarketComments = {
      idMarket: this.market.uuid,
      user: comment.user,
      comment: comment.comment
    };
    this.marketService.addComment(newComment).subscribe(resComment => {
      this.dataComment.push({comment: comment.comment, user: resComment.user, created: new Date(comment.created)});
      this.dataComment = sortComments(this.ascending, this.dataComment);
    });
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
    this.infoService.displayInfo('Le nom du marché a été copié !');
  }
}
