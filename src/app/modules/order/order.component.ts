import {Component, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  Order, OrderAttachmentType, OrderComment, OrderRecap, OrdersService
} from '../../services/backend/orders.service';
import {Account, AccountsService} from '../../services/backend/accounts.service';
import {Prestation, PrestationsService} from '../../services/backend/prestations.service';
import {BehaviorSubject, forkJoin, Observable, of, Subject, Subscription} from 'rxjs';
import {generateInterventionId} from '../../core/intervention.utils';
import {InterventionsService} from '../../services/backend/interventions.service';
import {debounceTime, mergeMap} from 'rxjs/operators';
import {AuthGuard} from '../../services/front/authguard.service';
import {LinesService} from '../../services/front/lines.service';
import {BillsService, Payment} from '../../services/backend/bills.service';
import {MatDialog, MatExpansionPanel} from '@angular/material';
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {InfoService} from '../../services/front/info.service';
import {Address, AddressWithRole} from '../../services/backend/addresses.service';
import {Attachment, AttachmentType} from '../file-upload/file-upload.component';
import {EstateAttachmentType, EstatesService} from '../../services/backend/estates.service';
import {User, UsersService} from '../../services/backend/users.service';
import {AccountUtils} from '../utils/account-utils';
import {
  Establishment, EstablishmentAddressRole, EstablishmentDelegateRole, EstablishmentsService
} from '../../services/backend/establishments.service';
import {
  People, PeopleAddressRole, PeopleService, PeopleWithOrigin, PeopleWithRole
} from '../../services/backend/people.service';
import {FormControl} from '@angular/forms';
import {AddressUtils} from '../utils/address-utils';
import {OrderStatus, OrderStatusLabel, OrderUtils} from '../utils/order-utils';
import {DataComment, EventType, sortComments} from '../events/events.component';
import {AttachmentsService, IAttachment} from '../../services/backend/attachments.service';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {EstateUtils} from '../utils/estate-utils';
import {map, startWith} from 'rxjs/internal/operators';
import {PeopleUtils} from '../utils/people-utils';
import {PlusActionData} from '../plus-button/plus-button.component';
import {AgencyService, IAgency} from '../../services/backend/agency.service';
import {CommentCreateDialogComponent} from '../comment-create-dialog/comment-create-dialog.component';
import {MarketEstablishment, MarketEstablishmentRole} from '../../services/backend/markets.service';

@Component({
  selector: 'app-order-account',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit, OnDestroy {

  sub: Subscription = new Subscription();
  action = false;

  isLoading = false;
  recapLoading = false;
  uuid: string;
  order: Order;

  set orderStatus(value: OrderStatus) {
    this._orderStatus = value;
    this.tabChange();
  }

  get orderStatus(): OrderStatus {
    return this._orderStatus;
  }

  purchaserContactName: string;
  purchaserContacts: PeopleWithOrigin[] = [];
  commercials: User[] = [];
  selectedCommercial: User;
  searchField: string;
  search: FormControl;
  accountEstablishment: string;
  accountBillingAddress: Address;
  payment: Payment;
  paymentTypeName: string;
  paymentDate: Subject<Date>;
  paid: number;
  message: string;
  status = {
    RECEIVED: OrderStatus.RECEIVED,
    FILLED: OrderStatus.FILLED,
    PRODUCTION: OrderStatus.PRODUCTION,
    BILLABLE: OrderStatus.BILLABLE,
    HONORED: OrderStatus.HONORED,
    CLOSED: OrderStatus.CLOSED,
    CANCELED: OrderStatus.CANCELED
  };
  index = 0;
  index2 = 0;
  saving = false;
  unsavedChanged = false;
  updateAttachmentList = new EventEmitter<void>();
  updateEstate = new EventEmitter<void>();
  updateIntervention = new EventEmitter<void>();
  updateDescription = new EventEmitter<any>();
  attachments: Attachment[];
  attachmentTypes: AttachmentType[];
  orderRecap: OrderRecap;
  userRights: ManagementRights = new ManagementRights();
  disabled: boolean;
  progressValue = 0;
  ascending = false;
  dataComment: DataComment[] = [];
  modification = false;
  modificationEvent = new EventEmitter<void>();

  actionData: PlusActionData[] = [];

  agencyControl = new FormControl();
  suggestedAgencies: IAgency[] = [];
  filteredOptions: Observable<IAgency[]>;

  billedToggle = 'establishment';
  selectedBilledEstablishment: string;
  possibleBilledEstablishments: Establishment[];
  possibleBilledEstablishmentIds: string[];
  payerToggle = 'establishment';
  selectedPayerEstablishment: string;
  possiblePayerEstablishments: Establishment[];
  possiblePayerEstablishmentIds: string[];
  @ViewChild('matBillExpansionPanel') matBillExpansionPanel: MatExpansionPanel;
  @ViewChild('matPayerExpansionPanel') matPayerExpansionPanel: MatExpansionPanel;

  private _orderStatus: OrderStatus;

  constructor(private route: ActivatedRoute,
              private ordersService: OrdersService,
              private prestationsService: PrestationsService,
              private interventionsService: InterventionsService,
              private accountsService: AccountsService,
              private establishmentsService: EstablishmentsService,
              private billsService: BillsService,
              private navigationService: NavigationService,
              private authGuard: AuthGuard,
              private linesService: LinesService,
              private infoService: InfoService,
              private estatesService: EstatesService,
              private peopleService: PeopleService,
              private agencyService: AgencyService,
              protected router: Router,
              protected activatedRoute: ActivatedRoute,
              protected usersService: UsersService,
              protected attachmentsService: AttachmentsService,
              protected dialog: MatDialog,
              protected attachmentService: AttachmentsService
  ) {
  }

  ngOnInit() {
    this.disabled = !this.userRights.orderManagement;
    if (this.activatedRoute.snapshot.queryParamMap.has('tab')) {
      const tabIndex = Number(this.activatedRoute.snapshot.queryParamMap.get('tab'));
      if (!isNaN(tabIndex)) {
        // @ts-ignore
        this.index = tabIndex;
      }
    }
    this.search = new FormControl({value: this.searchField, disabled: this.disabled});
    this.search.valueChanges.pipe(debounceTime(300))
      .subscribe((res) => this.suggestUser(res));
    this.payment = {uuid: null, type: null, value: null, received: false, date: null};
    this.paymentDate = new BehaviorSubject<Date>(null);
    this.isLoading = true;
    this.navigationService.set({menu: MenuStep.ORDERS, url: this.router.url});
    this.sub.add(this.route.params.subscribe(params => {
      this.uuid = params.id;
      this.getRecap();
      this.sub.add(this.ordersService.getOne(this.uuid).subscribe((order) => {
        if (!order) {
          this.isLoading = false;
        } else {
          this.order = order;
          // TODO : choose other establishment for individuals ?
          this.possibleBilledEstablishments = order.establishment ? order.establishment.delegates.filter(d => d.role === EstablishmentDelegateRole.BILLED).map(d => d.establishment) : [];
          if (this.order.establishment) {
            this.possibleBilledEstablishments.push(this.order.establishment.establishment);
          }
          if (this.order.market) {
            this.possibleBilledEstablishments = this.possibleBilledEstablishments.concat(this.order.market.marketEstablishments.filter(m => m.role === MarketEstablishmentRole.BILLED).map(m => m.establishment));
          }
          this.possibleBilledEstablishmentIds = this.possibleBilledEstablishments.map(e => e.uuid);
          if (!this.order.billedEstablishment && !order.billedContact && order.establishment) {
            this.order.billedEstablishment = order.establishment.establishment;
          }
          this.selectedBilledEstablishment = this.order.billedEstablishment ? this.order.billedEstablishment.uuid : null;
          this.billedToggle = this.order.billedContact ? 'individual' : 'establishment';

          // TODO : choose other establishment for individuals ?
          this.possiblePayerEstablishments = order.establishment ? order.establishment.delegates.filter(d => d.role === EstablishmentDelegateRole.PAYER).map(d => d.establishment) : [];
          if (this.order.establishment) {
            this.possiblePayerEstablishments.push(this.order.establishment.establishment);
          }
          if (this.order.market) {
            this.possiblePayerEstablishments = this.possiblePayerEstablishments.concat(this.order.market.marketEstablishments.filter(m => m.role === MarketEstablishmentRole.PAYER).map(m => m.establishment));
          }
          this.possiblePayerEstablishmentIds = this.possiblePayerEstablishments.map(e => e.uuid);
          if (!this.order.payerEstablishment && !order.payerContact && order.establishment) {
            this.order.payerEstablishment = order.establishment.establishment;
          }
          this.selectedPayerEstablishment = this.order.payerEstablishment ? this.order.payerEstablishment.uuid : null;
          this.payerToggle = this.order.payerContact ? 'individual' : 'establishment';

          this.sub.add(this.peopleService.getPurchasers(order.establishment.establishment.uuid, order.market ? order.market.uuid : null)
            .subscribe((purchasers) => {
              this.purchaserContacts = purchasers;
              this.orderStatus = this.getOrderStatus(this.order.status);
              this.disabled = this.disabled || this.orderStatus > this.status.FILLED;
              this.modification = this.orderStatus < this.status.FILLED;
              const purchaserFiltered: PeopleWithOrigin[] = purchasers.filter(p => p.people.uuid === order.purchaserContact.uuid);
              if (order.purchaserContact && purchaserFiltered.length === 0) {
                this.purchaserContacts.push({
                  people: order.purchaserContact,
                  origin: undefined
                });
              }
              this.purchaserContactName = order.purchaserContact ? this.getContactName(this.purchaserContacts.filter(p => p.people.uuid === order.purchaserContact.uuid)[0]) : null;
              this.accountEstablishment = order.establishment ? order.establishment.establishment.name : '';
              this.selectedCommercial = order.commercial;
              this.searchField = this.getUserName(this.selectedCommercial);
              this.search.setValue(this.getUserName(this.selectedCommercial));
              let address: AddressWithRole;
              if (this.order.establishment) {
                address = this.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.BILLING);
                address = address ? address : this.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.MAIN);
              } else {
                // Individual
                address = this.order.purchaserContact.addresses.find(a => a.role === PeopleAddressRole.BILLING);
                address = address ? address : this.order.purchaserContact.addresses.find(a => a.role === PeopleAddressRole.MAIN);
              }
              this.accountBillingAddress = address ? address.address : undefined;
              this.sub.add(this.agencyService.getAll().subscribe((agencies) => {
                if (!agencies) {
                  this.isLoading = false;
                } else {
                  this.suggestedAgencies = agencies;
                  const filteredAgencies: IAgency[] = this.order.agency ? agencies.filter(a => this.order.agency.uuid === a.uuid) : agencies.filter(a => a.officies.map(o => o.name).includes(this.order.commercial.office));
                  if (filteredAgencies.length !== 0) {
                    this.order.agency = filteredAgencies[0];
                    this.agencyControl.setValue(filteredAgencies[0]);
                  }
                  this.filteredOptions = this.agencyControl.valueChanges.pipe(startWith(this.order.agency ? this.order.agency.name : ''),
                    map(value => typeof value === 'string' ? value : value.name),
                    map(name => name ? name === this.order.agency.name ? this.suggestedAgencies.filter(option => this.order.agency.uuid !== option.uuid) : this.suggestedAgencies.filter(option => option.name.toLowerCase().includes(name.toLowerCase())) : this.suggestedAgencies.slice()));
                  this.isLoading = false;
                }
              }));
            }));
        }
      }));
    }));
    this.getAllComments();
  }

  displayAgency(agency: IAgency): string {
    return agency ? agency.name : '';
  }

  agencyChange(event) {
    if (event.option) {
      const agency = event.option.value;
      if (!this.order.agency || agency.uuid !== this.order.agency.uuid) {
        const oldName: string = this.order.agency ? this.suggestedAgencies.filter(a => this.order.agency.uuid === a.uuid)[0].name : this.suggestedAgencies.filter(a => a.officies.map(o => o.name).includes(this.order.commercial.office))[0].name;
        const prefix: string = 'L\'agence de production a été modifiée : ' + oldName + ' -> ' + agency.name + '.<br><b>Justification :</b> ';
        const dialogRef = this.dialog.open(CommentCreateDialogComponent, {
          width: '50%',
          restoreFocus: false,
          data: {
            title: 'Modification de l\'agence de production',
            message: 'Veuillez rentrer une justification.',
            eventType: EventType.MODIFICATION.toString(),
            prefix: prefix
          }
        });
        dialogRef.afterClosed().subscribe((comment: DataComment) => {
          if (comment) {
            this.agencyControl.setValue(agency);
            this.order.agency = agency;
            this.ordersService.update(this.order).subscribe((updatedOrder) => {
              if (updatedOrder) {
                this.saveComment(comment);
                this.infoService.displaySaveSuccess();
              }
            });
          } else {
            this.agencyControl.setValue(this.order.agency);
          }
        });
      }
    }
  }

  getAllComments() {
    this.dataComment = [];
    this.ordersService.getAllComments(this.uuid).subscribe((comments) => {
      comments.forEach(comment => {
        this.dataComment.push({
          comment: comment.comment,
          user: comment.user,
          created: new Date(comment.created),
          eventType: comment.event
        });
      });
    });
  }

  orderChanged() {
    this.ascending = !this.ascending;
  }

  saveComment(comment: DataComment) {
    const newComment: OrderComment = {
      user: comment.user,
      idOrder: this.order.uuid,
      comment: comment.comment,
      event: comment.eventType
    };
    this.ordersService.addComment(newComment).subscribe((resComment) => {
      this.dataComment.push({
        comment: resComment.comment,
        user: resComment.user,
        created: new Date(resComment.created),
        eventType: resComment.event
      });
      this.dataComment = sortComments(this.ascending, this.dataComment);
    });
  }

  getRecap() {
    this.recapLoading = true;
    this.sub.add(this.ordersService.getRecap(this.uuid).subscribe((orderRecap) => {
      if (orderRecap) {
        this.orderRecap = orderRecap;
        this.orderStatus = this.getOrderStatus(this.orderRecap.status);
        this.buildAttachments();
      }
      this.recapLoading = false;
    }));
  }

  buildAttachments() {
    this.attachmentsService.getByEntityId(this.uuid).subscribe(attachments => {
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
    if (this.orderRecap && this.orderRecap.targets && this.orderRecap.targets.length) {
      // TODO avoid using map in forkJoin
      /*forkJoin(this.orderRecap.estates.map((e) => this.estatesService.get(e))).subscribe((estates) => {
        estates.forEach((estate) => {
          if (estate.attachments) {
            estate.attachments.forEach((attachment) => {
              this.attachments.push({
                file: undefined,
                fileName: attachment.file,
                mandatory: false,
                object: {id: estate.id, label: estate.estateReference ? estate.estateReference : estate.adxReference},
                type: EstateAttachmentType.MAP,
                uuid: attachment.id
              });
            });
          }
        });
        this.attachmentTypes = [
          {types: Object.values(OrderAttachmentType), objects: [{id: this.uuid, label: undefined}]},
          {
            types: Object.values(EstateAttachmentType),
            objects: estates.map(e => ({id: e.id, label: e.estateReference ? e.estateReference : e.adxReference}))
          }
        ];
        setTimeout(() => this.updateAttachmentList.emit());
      });*/
    }
    this.attachmentTypes = [
      {types: Object.values(OrderAttachmentType), objects: [{id: this.uuid, label: undefined}]}
    ];
    setTimeout(() => this.updateAttachmentList.emit());
  }

  validateOrder() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: 'Passer à l\'étape suivante vous permettra de créer des interventions mais vous empêchera de modifier à nouveau la commande. Êtes-vous sûr de vouloir continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.saving = true;
        this.prestationsService.getFromOrder(this.uuid).subscribe((prestations) => {
          if (!prestations) {
            console.log('An error occurred when getting prestations from order ' + this.order.uuid);
            this.saving = false;
          } else {
            this.createIntervention(prestations, 0).subscribe((nbCreated) => {
              if (!nbCreated) {
                console.log('An error occured while creating new interventions for order ' + this.order.uuid);
                this.saving = false;
              } else {
                this.ordersService.setStatus(this.order.uuid, OrderStatusLabel.FILLED).subscribe((res) => {
                  if (!res) {
                    console.log('An error occurred when updating status of order ' + this.order.uuid);
                  } else {
                    this.order.status = OrderStatusLabel.FILLED;
                    this.orderStatus = OrderStatus.FILLED;
                    this.modification = false;
                    const message = nbCreated + ' ' + (nbCreated > 1 ? 'interventions créées.' : 'intervention créée.');
                    this.infoService.displaySuccess(message);
                    this.updateEstate.emit();
                    this.updateIntervention.emit();
                    this.getAllComments();
                  }
                  this.saving = false;
                  this.getRecap();
                });
              }
            });
          }
        });
      }
    });
  }

  createNewInterventions(prestations: Prestation[]): Observable<number> {
    const targetsWithDuplicates = prestations.map(p => p.targetId);
    const targets = targetsWithDuplicates.filter((n, i) => targetsWithDuplicates.indexOf(n) === i);
    return forkJoin(targets.map((target) => {
      const finalPrestations: Prestation[] = prestations.filter(p => p.targetId === target);
      return this.estatesService.get(finalPrestations[0].estate)
        .pipe(mergeMap((estate) => {
          const name = generateInterventionId();
          const reference = EstateUtils.getReferenceFromPrestation(estate, finalPrestations[0]);
          const address = EstateUtils.getAddressFromPrestation(estate, finalPrestations[0]);
          return this.interventionsService.createIntervention({
            name: name,
            createdBy: this.authGuard.getUsername(),
            estateAddress: AddressUtils.getFullName(address),
            estateReference: reference,
            orderName: this.order.name,
            clientName: this.accountEstablishment,
            accountUuid: this.order.establishment ? this.order.establishment.establishment.uuid : undefined
          })
            .pipe(mergeMap((intervention) => {
              const prestationsToUpdate: Prestation[] = finalPrestations.map((p) => ({
                orderLine: p.orderLine,
                analyse: p.analyse,
                estate: p.estate,
                targetId: p.targetId,
                estateType: p.estateType,
                mission: intervention.id,
                order: p.order,
                technicalAct: p.technicalAct,
                status: p.status,
                comment: p.comment,
                workDescription: p.workDescription,
                uuid: p.uuid,
                billLines: []
              }));
              return this.prestationsService.set([], prestationsToUpdate);
            }));
        }));
    })).pipe(map(() => targets.length));
  }

  createIntervention(prestations: Prestation[], index: number): Observable<number> {
    const target = this.orderRecap.targets[index];
    const finalPrestations = prestations.filter(p => p.targetId === target);
    const estateId = finalPrestations[0].estate;
    return this.estatesService.get(estateId)
      .pipe(mergeMap((estate) => {
        const name = generateInterventionId();
        const reference = EstateUtils.getReferenceFromPrestation(estate, finalPrestations[0]);
        const address = EstateUtils.getAddressFromPrestation(estate, finalPrestations[0]);
        return this.interventionsService.createIntervention({
          name: name,
          createdBy: this.authGuard.getUsername(),
          estateAddress: AddressUtils.getFullName(address),
          estateReference: reference,
          orderName: this.order.name,
          clientName: this.accountEstablishment,
          accountUuid: this.order.establishment ? this.order.establishment.establishment.uuid : undefined
        })
          .pipe(mergeMap((intervention) => {
            const prestationsToUpdate: Prestation[] = finalPrestations.map((p) => ({
              orderLine: p.orderLine,
              analyse: p.analyse,
              estate: p.estate,
              targetId: p.targetId,
              estateType: p.estateType,
              mission: intervention.id,
              order: p.order,
              technicalAct: p.technicalAct,
              status: p.status,
              comment: p.comment,
              workDescription: p.workDescription,
              uuid: p.uuid,
              billLines: []
            }));
            return this.prestationsService.set([], prestationsToUpdate)
              .pipe(mergeMap((resp) => {
                this.progressValue = ((index + 1) / this.orderRecap.targets.length) * 100;
                if (index < this.orderRecap.targets.length - 1) {
                  return this.createIntervention(prestations, index + 1);
                } else {
                  return of(index + 1);
                }
              }));
          }));
      }));
  }

  isOrderComplete(): boolean {
    return this.order && this.orderRecap && !this.unsavedChanged && this.order.received && this.order.deadline
      && this.order.referenceFile && this.order.referenceNumber
      && this.orderRecap.targets.length > 0 && this.orderRecap.estateWithoutPrestations === 0;
  }

  copyMessage(val: string) {
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
    this.infoService.displayInfo('Le numéro de commande a été copié !');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  removeAttachment(attachment: Attachment) {
    if (attachment.type === EstateAttachmentType.MAP) {
      this.estatesService.deleteAttachment(attachment.uuid).subscribe((resp) => {
        if (resp) {
          this.infoService.displaySaveSuccess();
        }
        this.buildAttachments();
      });
    }
  }

  downloadAttachment(attachment: Attachment) {
    this.attachmentService.getFile(this.order.uuid, attachment.fileName, 'orders').subscribe((blob) => {
      if (blob) {
        const data = window.URL.createObjectURL(blob);
        window.open(data, '_blank');
      }
    });
  }

  uploadAttachment(attachment: Attachment) {
    if (attachment.type === EstateAttachmentType.MAP) {
      this.estatesService.addAttachment(attachment.object.id, attachment.file).subscribe((newUuid) => {
        if (newUuid && newUuid.uuid) {
          this.infoService.displaySaveSuccess();
        }
        this.buildAttachments();
      });
    } else {
      const attachmentType = this.getOrderType(attachment.type);
      if (attachmentType === OrderAttachmentType.PURCHASE_ORDER) {
        this.order.referenceFile = attachment.fileName;
      }
      const att: IAttachment = {
        vfk: this.order.uuid,
        filename: attachment.fileName,
        user: {
          login: localStorage.getItem('username')
        },
        attachmentType: attachmentType,
        attachedUuid: null
      };
      this.attachmentsService.add(att, attachment.object.id, attachment.file, 'orders', this.order.uuid).subscribe(() => {
        this.ordersService.update(this.order).subscribe((updatedOrder) => {
          if (updatedOrder) {
            this.order = updatedOrder;
            if (attachmentType === OrderAttachmentType.PURCHASE_ORDER) {
              this.updateDescription.emit({file: attachment.file, name: attachment.fileName});
              this.order.attachment = attachment;
            }
            this.infoService.displaySaveSuccess();
          }
          this.buildAttachments();
        });
      });
    }
  }

  getOrderType(typeName: string) {
    let type: OrderAttachmentType;
    if (Object.values(OrderAttachmentType).some((col: string) => col === typeName)) {
      type = typeName as OrderAttachmentType;
    }
    return type;
  }

  updateRecap(newOrder: Order) {
    this.order = newOrder;
    this.getRecap();
  }

  updateEstateTrigger() {
    this.getRecap();
    this.ordersService.getOne(this.uuid).subscribe((order) => {
      // Get order to retrieve updated orderLines
      this.order = order;
      setTimeout(() => this.updateEstate.emit());
    });
  }

  selectCommercial(user: User) {
    this.selectedCommercial = this.commercials.find(c => c.login === user.login);
    this.searchField = this.selectedCommercial ? this.getUserName(this.selectedCommercial) : '';
    if (this.selectedCommercial && this.selectedCommercial.login !== this.order.commercial.login) {
      this.order.commercial = this.selectedCommercial;
      this.ordersService.update(this.order).subscribe((updatedOrder) => {
        if (updatedOrder) {
          this.infoService.displaySaveSuccess();
        }
      });
    }
  }

  suggestUser(text: string) {
    if (text && text.length > 1) {
      this.usersService.searchUser(text).subscribe((results) => {
        this.commercials = results.map(user => User.fromData(user));
      });
    } else {
      this.commercials = [];
    }
  }

  selectPurchaserContact(contact: PeopleWithOrigin) {
    if (!this.order.purchaserContact || contact.people.uuid !== this.order.purchaserContact.uuid) {
      this.order.purchaserContact = contact.people;
      this.ordersService.update(this.order).subscribe((updatedOrder) => {
        if (updatedOrder) {
          this.infoService.displaySaveSuccess();
        }
      });
    }
  }

  getName(account: Account) {
    return AccountUtils.getName(account);
  }

  getUserName(commercial: User) {
    return commercial ? commercial.last_name.toUpperCase() + ' ' + commercial.first_name : '';
  }

  getOrderStatus(status: OrderStatusLabel) {
    return OrderUtils.getStatus(status);
  }

  getStatusColor(status: OrderStatus) {
    return OrderUtils.getStatusColor(status);
  }

  getStatusName(status: OrderStatus) {
    return OrderUtils.getStatusName(status);
  }

  modifyOrder() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Confirmation',
        text: 'Êtes-vous sûr de vouloir modifier cette commande ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.modification = true;
        this.modificationEvent.emit();
        this.actionData.push({
          label: 'Valider les modifications',
          icon: 'done',
          function: () => {
            this.validateModification();
            this.getAllComments();
          },
          disabled: this.saving
        });
      }
    });
  }

  validateModification() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Confirmation',
        text: 'Êtes-vous sûr de vouloir valider cette commande ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.saving = true;
        this.modification = false;
        this.prestationsService.getFromOrder(this.uuid).subscribe((prestations) => {
          if (!prestations) {
            console.log('An error occurred when getting prestations from order ' + this.order.uuid);
            this.saving = false;
          } else {
            const newPrestations: Prestation[] = prestations.filter(p => !p.mission && p.technicalAct);
            if (newPrestations.length > 0) {
              this.createNewInterventions(newPrestations).subscribe((nbCreated) => {
                if (!nbCreated) {
                  console.log('An error occured while creating new interventions for order ' + this.order.uuid);
                  this.saving = false;
                } else {
                  this.saving = false;
                  const message = nbCreated + ' ' + (nbCreated > 1 ? 'interventions créées.' : 'intervention créée.');
                  this.infoService.displaySuccess(message);
                  this.modificationEvent.emit();
                }
              });
            } else {
              this.saving = false;
              this.infoService.displaySuccess('Informations validées.');
              this.modificationEvent.emit();
            }
          }
        });
      }
    });
  }

  cancelOrder() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: 'Êtes-vous sûr de vouloir annuler cette commande ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.saving = true;
        this.ordersService.setStatus(this.order.uuid, OrderStatusLabel.CANCELED).subscribe((res) => {
          if (!res) {
            console.log('An error occurred when updating status of order ' + this.order.uuid);
          } else {
            this.order.status = OrderStatusLabel.CANCELED;
            this.orderStatus = OrderStatus.CANCELED;
            this.disabled = true;
            this.updateEstate.emit();
            this.infoService.displaySaveSuccess();
          }
          this.saving = false;
        });
      }
    });
  }

  getBilledName(): string {
    if (this.order.billedEstablishment) {
      return this.order.billedEstablishment.name;
    } else if (this.order.billedContact) {
      return this.getPeopleName(this.order.billedContact);
    } else if (this.order.establishment) {
      return this.order.establishment.establishment.name;
    } else {
      // TODO : when individual is client
      return 'Facturé inconnu';
    }
  }

  getPayerName(): string {
    if (this.order.payerEstablishment) {
      return this.order.payerEstablishment.name;
    } else if (this.order.payerContact) {
      return this.getPeopleName(this.order.payerContact);
    } else if (this.order.establishment) {
      return this.order.establishment.establishment.name;
    } else {
      // TODO : when individual is client
      return 'Facturé inconnu';
    }
  }

  changeBilledEstablishment() {
    const establishment: Establishment = this.possibleBilledEstablishments.find(e => e.uuid === this.selectedBilledEstablishment);
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: 'L\'établissement ' + establishment.name + ' sera facturé pour cette commande. Voulez-vous continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.matBillExpansionPanel.close();
        const commentMessage = 'Le compte facturé a été modifié : ' + this.getBilledName() + ' -> ' + establishment.name;
        this.order.billedContact = null;
        this.order.billedEstablishment = establishment;
        this.ordersService.update(this.order).subscribe((updatedOrder) => {
          if (updatedOrder) {
            this.usersService.get(localStorage.getItem('username')).subscribe((user) => {
              const comment: DataComment = {
                comment: commentMessage,
                user: user,
                eventType: EventType.MODIFICATION.toString(),
                created: new Date()
              };
              this.saveComment(comment);
              this.infoService.displaySaveSuccess();
            });
          }
        });
      } else {
        this.selectedBilledEstablishment = this.order.billedEstablishment ? this.order.billedEstablishment.uuid : null;
      }
    });
  }

  changePayerEstablishment() {
    const establishment: Establishment = this.possiblePayerEstablishments.find(e => e.uuid === this.selectedPayerEstablishment);
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: 'L\'établissement ' + establishment.name + ' sera considéré comme le payeur de cette commande. Voulez-vous continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.matPayerExpansionPanel.close();
        const commentMessage = 'Le compte payeur a été modifié : ' + this.getPayerName() + ' -> ' + establishment.name;
        this.order.payerContact = null;
        this.order.payerEstablishment = establishment;
        this.ordersService.update(this.order).subscribe((updatedOrder) => {
          if (updatedOrder) {
            this.usersService.get(localStorage.getItem('username')).subscribe((user) => {
              const comment: DataComment = {
                comment: commentMessage,
                user: user,
                eventType: EventType.MODIFICATION.toString(),
                created: new Date()
              };
              this.saveComment(comment);
              this.infoService.displaySaveSuccess();
            });
          }
        });
      } else {
        this.selectedPayerEstablishment = this.order.payerEstablishment ? this.order.payerEstablishment.uuid : null;
      }
    });
  }

  selectBilledContact(peopleWithRole: PeopleWithRole) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: PeopleUtils.getFullName(peopleWithRole.people) + ' sera facturé pour cette commande. Voulez-vous continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.matBillExpansionPanel.close();
        const commentMessage = 'Le compte facturé a été modifié : ' + this.getBilledName() + ' -> ' + this.getPeopleName(peopleWithRole.people);
        this.order.billedEstablishment = null;
        this.selectedBilledEstablishment = null;
        this.order.billedContact = peopleWithRole.people;
        this.ordersService.update(this.order).subscribe((updatedOrder) => {
          if (updatedOrder) {
            this.usersService.get(localStorage.getItem('username')).subscribe((user) => {
              const comment: DataComment = {
                comment: commentMessage,
                user: user,
                eventType: EventType.MODIFICATION.toString(),
                created: new Date()
              };
              this.saveComment(comment);
              this.infoService.displaySaveSuccess();
            });
          }
        });
      }
    });
  }

  selectPayerContact(peopleWithRole: PeopleWithRole) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Attention',
        text: PeopleUtils.getFullName(peopleWithRole.people) + ' sera considéré comme le payeur de cette commande. Voulez-vous continuer ?'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.matPayerExpansionPanel.close();
        const commentMessage = 'Le compte payeur a été modifié : ' + this.getPayerName() + ' -> ' + this.getPeopleName(peopleWithRole.people);
        this.order.payerEstablishment = null;
        this.selectedPayerEstablishment = null;
        this.order.payerContact = peopleWithRole.people;
        this.ordersService.update(this.order).subscribe((updatedOrder) => {
          if (updatedOrder) {
            this.usersService.get(localStorage.getItem('username')).subscribe((user) => {
              const comment: DataComment = {
                comment: commentMessage,
                user: user,
                eventType: EventType.MODIFICATION.toString(),
                created: new Date()
              };
              this.saveComment(comment);
              this.infoService.displaySaveSuccess();
            });
          }
        });
      }
    });
  }

  getContactName(contact: PeopleWithOrigin) {
    return PeopleUtils.getName(contact.people);
  }

  getPeopleName(contact: People) {
    return PeopleUtils.getName(contact);
  }

  tabChange() {
    this.actionData = [];
    if (this.orderStatus === OrderStatus.RECEIVED && !this.disabled) {
      this.actionData.push({
        label: 'Confirmer les informations',
        icon: 'done',
        function: () => {
          this.validateOrder();
          this.getAllComments();
        },
        disabled: this.saving || !this.isOrderComplete()
      });
    }

    if (this.orderStatus === OrderStatus.PRODUCTION && !this.disabled) {
      if (!this.modification) {
        this.actionData.push({
          label: 'Modifier la commande',
          icon: 'create',
          function: () => {
            this.modifyOrder();
            this.getAllComments();
          },
          disabled: this.saving
        });
      } else {
        this.actionData.push({
          label: 'Valider les modifications',
          icon: 'done',
          function: () => {
            this.validateModification();
            this.getAllComments();
          },
          disabled: this.saving
        });
      }
    }

    if (this.orderStatus < OrderStatus.PRODUCTION && !this.disabled) {
      this.actionData.push({
        label: 'Annuler la commande',
        icon: 'close',
        function: () => {
          this.cancelOrder();
          this.getAllComments();
        },
        disabled: this.saving
      });
    }
  }

  addAction(evt) {
    setTimeout(() => {
      this.tabChange();
      this.actionData.push(...evt);
    });
  }

  isBilledEstablishmentComplete() {
    return this.selectedBilledEstablishment && ((this.selectedBilledEstablishment && !this.order.billedEstablishment)
      || (this.order.billedEstablishment && this.selectedBilledEstablishment !== this.order.billedEstablishment.uuid));
  }

  isPayerEstablishmentComplete() {
    return this.selectedPayerEstablishment && ((this.selectedPayerEstablishment && !this.order.payerEstablishment)
      || (this.order.payerEstablishment && this.selectedPayerEstablishment !== this.order.payerEstablishment.uuid));
  }

  getBillEstablishmentName(establishment: string) {
    return this.possibleBilledEstablishments.find((value) => value.uuid === establishment).name;
  }

  getPayerEstablishmentName(establishment: string) {
    return this.possiblePayerEstablishments.find((value) => value.uuid === establishment).name;
  }
}
