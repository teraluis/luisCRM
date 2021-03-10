import {
  Component,
  DoCheck,
  EventEmitter,
  KeyValueDiffer,
  KeyValueDiffers,
  OnInit
} from '@angular/core';
import {Account, AccountsService} from '../../services/backend/accounts.service';
import {Order, OrdersService} from '../../services/backend/orders.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LockService} from '../../services/front/lock.service';
import {
  DraftIntervention, InterventionAttachmentType, InterventionsService, MaterializedIntervention
} from '../../services/backend/interventions.service';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {InfoService} from '../../services/front/info.service';
import {forkJoin} from 'rxjs';
import {Estate, EstatesService} from '../../services/backend/estates.service';
import {Address, AddressesService} from '../../services/backend/addresses.service';
import {
  InterventionComment, InterventionCommentForm, InterventionCommentService
} from '../../services/backend/intervention-comment.service';
import {take} from 'rxjs/operators';
import {MatDialog} from '@angular/material';
import {CommentCreateDialogComponent} from '../comment-create-dialog/comment-create-dialog.component';
import {IMarket} from '../../services/backend/markets.service';
import {AddressUtils} from '../utils/address-utils';
import {AccountUtils} from '../utils/account-utils';
import {InterventionPeopleRole, InterventionStatus, InterventionUtils} from '../utils/intervention-utils';
import {Attachment, AttachmentType} from '../file-upload/file-upload.component';
import {PlusActionData} from '../plus-button/plus-button.component';
import {DataComment, sortComments} from '../events/events.component';
import {PeopleWithRole} from '../../services/backend/people.service';
import {Prestation} from '../../services/backend/prestations.service';
import {InterventionUpdateDialogComponent} from './intervention-update-dialog/intervention-update-dialog.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {EstateUtils} from '../utils/estate-utils';
import {AttachmentsService, IAttachment} from '../../services/backend/attachments.service';
import {shortcuts} from '../../services/backend/technical-act.service';
import {ConfirmationComponent} from '../confirmation/confirmation.component';

@Component({
  selector: 'app-intervention',
  templateUrl: './intervention.component.html',
  styleUrls: ['./intervention.component.scss']
})
export class InterventionComponent implements OnInit, DoCheck {

  /* Global loaders */
  loading = false;
  workInProgress = false;

  intervention: MaterializedIntervention;
  draftIntervention: DraftIntervention;
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;

  market: IMarket;
  order: Order;
  workDescription: string;
  prestationLabels: string[];
  estate: Estate;
  firstAddress: Address;
  interventionPeople: PeopleWithRole[];
  contactRoles: string[] = Object.values(InterventionPeopleRole);

  action = false;
  isManualScheduleExpanded: boolean;

  index = 0;
  interventionComments: InterventionComment[] = [];
  attachments: Attachment[] = [];
  attachmentTypes: AttachmentType[] = [];
  interventionId: any;

  updateAttachmentList = new EventEmitter<void>();

  dataComments: DataComment[] = [];
  ascending = false;
  actionData: PlusActionData[] = [];

  private iterableDiffer: KeyValueDiffer<any, any>;

  constructor(public dialog: MatDialog,
              protected navigationService: NavigationService,
              protected router: Router,
              protected activatedRoute: ActivatedRoute,
              protected accountsService: AccountsService,
              protected orderService: OrdersService,
              protected estateService: EstatesService,
              protected interventionsService: InterventionsService,
              protected infoService: InfoService,
              private addressesService: AddressesService,
              private interventionCommentService: InterventionCommentService,
              public lockService: LockService,
              protected attachmentService: AttachmentsService,
              private iterableDiffers: KeyValueDiffers) {
    this.initActionButton();
  }

  ngDoCheck(): void {
    if (this.iterableDiffer) {
      const changes = this.iterableDiffer.diff(this.intervention);
      if (changes) {
        this.initActionButton();
      }
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.disabled = !this.userRights.orderManagement;
    this.isManualScheduleExpanded = false;
    this.navigationService.set({menu: MenuStep.INTERVENTIONS, url: this.router.url});
    // Get intervention id
    this.interventionId = this.activatedRoute.snapshot.paramMap.get('interventionId');
    // Get order, account and market
    const orderId = this.activatedRoute.snapshot.paramMap.get('orderId');
    if (this.activatedRoute.snapshot.queryParamMap.has('tab')) {
      const tabIndex = Number(this.activatedRoute.snapshot.queryParamMap.get('tab'));
      if (!isNaN(tabIndex)) {
        // @ts-ignore
        this.index = tabIndex;
      }
    }
    forkJoin(
      this.orderService.getOne(orderId).pipe(take(1)),
      this.interventionsService.getOne(this.interventionId).pipe(take(1))
    ).subscribe(([order, intervention]: [Order, MaterializedIntervention]) => {
      this.order = order;
      this.market = order.market;
      const prestationsOrders: Prestation[] = intervention.asCreated().prestations.filter(p => p.orderLine);

      this.prestationLabels = prestationsOrders.map(prestation => prestation.technicalAct.shortcut);
      const prestationRaat = prestationsOrders.find(p => p.technicalAct.shortcut === shortcuts.RAAT);
      this.workDescription = prestationRaat ? prestationRaat.workDescription : undefined;
      this.iterableDiffer = this.iterableDiffers.find(intervention).create();
      this.intervention = intervention;
      this.draftIntervention = intervention as DraftIntervention;
      this.interventionStatus = InterventionUtils.getStatus(this.intervention);
      this.interventionPeople = this.interventionStatus >= this.SETTLED_STATUS ? intervention.asSettled().parameters.contacts : [];
      this.actionData[0].disabled = this.interventionStatus !== this.SCHEDULED_STATUS;
      this.actionData[1].disabled = this.interventionStatus < this.SCHEDULED_STATUS;
      forkJoin(
        this.estateService.get(prestationsOrders[0].estate).pipe(take(1)), // TODO get PartialEstate
        this.interventionCommentService.listInterventionComments(this.intervention.id).pipe(take(1))
      ).subscribe(([estate, comments]) => {
        if (!!estate) {
          this.estate = estate;
          this.firstAddress = EstateUtils.getAddressFromPrestation(this.estate, intervention.asCreated().prestations[0]);
        }
        comments.forEach((comment) => {
          this.dataComments.push({comment: comment.comment, user: comment.user, created: new Date(comment.date)});
        });
        this.interventionComments = comments;
        this.buildAttachments();
        this.loading = false;
      });
    });
  }

  getAllComments() {
    this.interventionCommentService.listInterventionComments(this.interventionId).subscribe((comments) => {
      this.dataComments = [];
      comments.forEach((comment) => {
        this.dataComments.push({comment: comment.comment, user: comment.user, created: new Date(comment.date)});
      });
      this.interventionComments = comments;
    });
  }

  sendMail(): void {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Confirmation',
        text: 'Vous allez envoyer l\'email contenant le fichier PHP à l\'expert. Êtes-vous sûr de vouloir continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.workInProgress = true;
        this.interventionsService.sendMail(this.intervention.id).pipe(take(1)).subscribe(() => {
          this.infoService.displaySuccess('L\'e-mail a bien été envoyé !');
          this.workInProgress = false;
        });
      }
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
    this.infoService.displayInfo('Le numéro d\'intervention a été copié !');
  }

  buildAttachments() {
    this.attachmentService.getByEntityId(this.interventionId).subscribe(attachments => {
        this.attachments = [];
        attachments.forEach(attachment => {
          this.attachments.push({
            file: undefined,
            fileName: attachment.filename,
            mandatory: true,
            object: {id: attachment.uuid, label: undefined},
            type: attachment.attachmentType,
            uuid: attachment.uuid,
            author: attachment.user.login,
            created: attachment.created
          });
        });
      }
    );
    this.attachmentTypes = [
      {types: Object.values(InterventionAttachmentType), objects: [{id: undefined, label: undefined}]}
    ];
    setTimeout(() => this.updateAttachmentList.emit());
  }

  removeAttachment(attachment: Attachment) {

  }

  downloadAttachment(attachment: Attachment) {
    this.attachmentService.getFile(this.interventionId, attachment.fileName, 'interventions').subscribe((blob) => {
      if (blob) {
        const data = window.URL.createObjectURL(blob);
        window.open(data, '_blank');
      }
    });
  }

  uploadAttachment(attachment: Attachment) {
    const att: IAttachment = {
      vfk: this.interventionId,
      filename: attachment.fileName,
      user: {
        login: localStorage.getItem('username')
      },
      attachmentType: this.getInterventionType(attachment.type),
      attachedUuid: null
    };

    this.attachmentService.add(att, attachment.object.id, attachment.file, 'interventions', this.interventionId).subscribe(obj => {
      this.buildAttachments();
    });
  }

  getInterventionType(typeName: string) {
    let type: InterventionAttachmentType;
    if (Object.values(InterventionAttachmentType).some((col: string) => col === typeName)) {
      type = typeName as InterventionAttachmentType;
    }
    return type;
  }

  refreshIntervention(event: MaterializedIntervention): void {
    this.intervention = event;
    this.draftIntervention = this.intervention.asDraft();
    this.interventionStatus = InterventionUtils.getStatus(this.intervention);
  }

  addComment(): void {
    const dialogRef = this.dialog.open(CommentCreateDialogComponent, {
      width: '40%'
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe((comment: DataComment) => {
      if (comment) {
        this.saveComment(comment);
      }
    });
  }

  saveComment(comment: DataComment): void {
    const commentForm: InterventionCommentForm = {
      comment: comment.comment,
      idIntervention: this.intervention.id,
      idUser: comment.user.login
    };
    this.interventionCommentService.addInterventionComment(commentForm).pipe(take(1)).subscribe((newComment) => {
      this.interventionComments.push(newComment);
      this.dataComments.push({
        comment: newComment.comment,
        user: newComment.user,
        created: new Date(newComment.date)
      });
      this.dataComments = sortComments(this.ascending, this.dataComments);
    });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  updateIntervention(): void {
    const dialogRef = this.dialog.open(InterventionUpdateDialogComponent, {
      data: {
        intervention: this.intervention,
        order: this.order
      },
      width: '40%'
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe((res) => {
      this.shouldReload(!!res);
    });
  }

  canUpdateStatus(): boolean {
    return this.intervention && (this.intervention.isSchedule || this.intervention.isIncomplete);
  }

  canSchedule(): boolean {
    return this.intervention && this.intervention.isSettled;
  }

  shouldReload(res: boolean) {
    if (res) {
      const currentRoute = this.router.url;
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate([currentRoute]);
        this.reduceManualScheduling();
      });
    } else {
      this.reduceManualScheduling();
    }
  }

  expandManualScheduling(): void {
    this.isManualScheduleExpanded = true;
  }

  reduceManualScheduling(): void {
    this.isManualScheduleExpanded = false;
  }

  getPhpFile() {
    this.workInProgress = true;
    this.interventionsService.generatePhpFile(this.intervention.id, this.intervention.asDraft().name).subscribe((file) => {
      if (!file) {
        this.workInProgress = false;
      } else {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(file.image);
        link.download = file.fileName;
        link.click();
        this.workInProgress = false;
      }
    });
  }

  interventionStatus = InterventionStatus.DRAFT;

  // Tricks to be able to use enum in template
  readonly DRAFT_STATUS = InterventionStatus.DRAFT;
  readonly CREATED_STATUS = InterventionStatus.CREATED;
  readonly SETTLED_STATUS = InterventionStatus.SETTLED;
  readonly TOSCHEDULE_STATUS = InterventionStatus.TO_SCHEDULE;
  readonly SCHEDULED_STATUS = InterventionStatus.SCHEDULED;
  readonly INCOMPLETE_STATUS = InterventionStatus.INCOMPLETE;
  readonly DONE_STATUS = InterventionStatus.DONE;

  getFullAddress(address: Address) {
    return AddressUtils.getFullName(address);
  }

  getAccountName(account: Account) {
    return AccountUtils.getName(account);
  }

  getStatusColor(key: string) {
    return InterventionUtils.getStatusColor(InterventionUtils.getStatusFromLabel(key));
  }

  getStatusName(key: string) {
    return InterventionUtils.getStatusName(InterventionUtils.getStatusFromLabel(key));
  }

  initActionButton() {
    this.actionData = [
      {
        label: 'Email',
        icon: 'email',
        function: () => this.sendMail()
      },
      {
        label: 'Fichier PHP',
        icon: 'unarchive',
        function: () => this.getPhpFile()
      }
    ];

    if (this.canUpdateStatus()) {
      if (this.intervention.isSchedule) {
        this.actionData.push({
          label: 'Pré clôturer manuellement',
          icon: 'done',
          function: () => this.updateIntervention()
        });
      }

      if (this.intervention.isIncomplete) {
        this.actionData.push({
          label: 'Clôturer manuellement et facturer l\'intervention',
          icon: 'done',
          disabled: !this.intervention.asIncomplete().prestations.filter(p => p.resultId).length,
          function: () => this.updateIntervention()
        });
      }
    }
  }

  addAction(evt) {
    setTimeout(() => {
      this.initActionButton();
      this.actionData.push(...evt);
    });
  }
}
