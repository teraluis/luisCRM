import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SidePanelService, SidePanelType} from '../../../services/front/sidepanel.service';
import {Order, OrderAttachmentType, OrdersService, ReportDestination, ReportDestinationDisplay
} from '../../../services/backend/orders.service';
import {DatePipe} from '@angular/common';
import {InfoService} from '../../../services/front/info.service';
import {OrderStatus, OrderUtils} from "../../utils/order-utils";
import {AttachmentsService, IAttachment} from "../../../services/backend/attachments.service";
import {People} from "../../../services/backend/people.service";
import {PeopleUtils} from "../../utils/people-utils";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-order-description',
  templateUrl: './order-description.component.html',
  styleUrls: ['./order-description.component.scss']
})
export class OrderDescriptionComponent implements OnInit {

  @ViewChild('fileInput') fileInputElement: ElementRef;

  @Input() status: OrderStatus;
  @Input() modification: boolean;
  @Input() order: Order;
  @Input() update: EventEmitter<any>;
  @Input() disabled: boolean;

  @Output() updateOrder = new EventEmitter<Order>();
  @Output() emitChanged = new EventEmitter();

  isLoading = true;
  changed = false;
  newOrder: Order;
  referenceFile: File;
  isComplete = false;
  reportDestinations: ReportDestinationDisplay[] = [];
  saving = false;
  isReferenceFileChanged = false;
  orderStatus = {
    RECEIVED: OrderStatus.RECEIVED,
    FILLED: OrderStatus.FILLED,
    PRODUCTION: OrderStatus.PRODUCTION,
    BILLABLE: OrderStatus.BILLABLE,
    HONORED: OrderStatus.HONORED,
    CLOSED: OrderStatus.CLOSED,
    CANCELED: OrderStatus.CANCELED
  };
  orderForm: FormGroup;

  constructor(private ordersService: OrdersService,
              private datepipe: DatePipe,
              private infoService: InfoService,
              private attachmentsService: AttachmentsService,
              private sidePanelService: SidePanelService,
              private fb: FormBuilder) {
  }

  ngOnInit() {
    this.initialize();
    this.update.subscribe((referenceFile) => this.updateReferenceFile(referenceFile));
  }

  updateReferenceFile(json: any) {
    this.referenceFile = json.file;
    this.newOrder.referenceFile = json.name;
  }

  initialize() {

    this.referenceFile = null;
    this.isReferenceFileChanged = false;
    this.newOrder = OrderUtils.buildOrder(this.order);
    this.reportDestinations = [];
    for (const reportDest of this.newOrder.reportDestinations) {
      this.reportDestinations.push(new ReportDestinationDisplay(reportDest));
    }

    this.orderForm = this.fb.group({
      referenceNumber: [{
        value: this.newOrder.referenceNumber,
        disabled: this.disabled || this.status > OrderStatus.RECEIVED
      }, Validators.required],
      receiveDate: [{
        value: this.newOrder.received ? moment(this.newOrder.received) : null,
        disabled: this.disabled || this.status > OrderStatus.RECEIVED
      }, Validators.required],
      adviceVisit: [{
        value: this.newOrder.adviceVisit ? moment(this.newOrder.adviceVisit) : null,
        disabled: this.disabled || !this.modification
      }],
      referenceFile: [{
        value: this.newOrder.referenceFile,
        disabled: this.disabled || this.status > OrderStatus.RECEIVED
      }, Validators.required],
      deadline: [{
        value: this.newOrder.deadline ? moment(this.newOrder.deadline) : null,
        disabled: this.disabled || !this.modification
      }, Validators.required],
      assessment: [{
        value: this.newOrder.assessment ? moment(this.newOrder.assessment) : null,
        disabled: this.disabled || !this.modification
      }],
      description: [{
        value: this.newOrder.description,
        disabled: this.disabled || !this.modification
      }],
    });

    this.checkComplete();
    this.isLoading = false;
  }

  checkComplete() {
    if (this.newOrder.received && this.newOrder.deadline && this.newOrder.referenceFile && this.newOrder.referenceNumber) {
      this.isComplete = true;
    }
  }

  preventEventKeyboard(event) {
    event.preventDefault();
  }

  onFileChange(event) {
    this.referenceFile = event.target.files.item(0);
    this.newOrder.referenceFile = this.referenceFile.name;
    this.fileInputElement.nativeElement.value = '';
    this.orderForm.get('referenceFile').setValue(this.referenceFile.name);
    this.orderForm.get('referenceFile').markAsDirty();
  }

  clearFileInput() {
    this.referenceFile = null;
    this.newOrder.referenceFile = null;
    this.isReferenceFileChanged = true;
    this.orderForm.get('referenceFile').reset();
    this.orderForm.get('referenceFile').markAsDirty();
  }

  downloadFile() {
    if (this.referenceFile) {
      const data = window.URL.createObjectURL(this.referenceFile);
      window.open(data, '_blank');
    } else {
      this.ordersService.getReferenceFile(this.order.uuid, this.newOrder.referenceFile).subscribe((blob) => {
        if (blob) {
          const data = window.URL.createObjectURL(blob);
          window.open(data, '_blank');
        }
      });
    }
  }

  save() {
    this.saving = true;
    if (this.referenceFile) {
      const attachment: IAttachment = {
        vfk: this.newOrder.uuid,
        filename: this.orderForm.get('referenceFile').value,
        user: {
          login: localStorage.getItem('username')
        },
        attachmentType: OrderAttachmentType.PURCHASE_ORDER,
        attachedUuid: null
      };
      this.attachmentsService.getByEntityId(this.newOrder.uuid).subscribe(attachments => {
        let att;
        attachments.forEach(a => {
          if (this.getInterventionType(a.attachmentType) === OrderAttachmentType.PURCHASE_ORDER) {
            att = a;
          }
        });
        this.attachmentsService.add(attachment, att ? att.uuid : null, this.referenceFile, 'orders', this.order.uuid).subscribe(() => {
          this.updateOrderStep(attachment);
        });
      });
    } else {
      this.updateOrderStep();
    }
  }

  getInterventionType(typeName: string) {
    let type: OrderAttachmentType;
    if (Object.values(OrderAttachmentType).some((col: string) => col === typeName)) {
      type = typeName as OrderAttachmentType;
    }
    return type;
  }

  updateOrderStep(attachment?) {
    this.newOrder.deadline = this.orderForm.get('deadline').value.valueOf();
    this.newOrder.referenceNumber = this.orderForm.get('referenceNumber').value;
    this.newOrder.received = this.orderForm.get('receiveDate').value.valueOf();
    this.newOrder.adviceVisit = this.orderForm.get('adviceVisit').value ? this.orderForm.get('adviceVisit').value.valueOf() : null;
    this.newOrder.assessment = this.orderForm.get('assessment').value ? this.orderForm.get('assessment').value.valueOf() : null;
    this.newOrder.description = this.orderForm.get('description').value;
    this.ordersService.update(this.newOrder).subscribe((res) => {
      if (res) {
        this.checkComplete();
        this.infoService.displaySaveSuccess();
        if (attachment) {
          this.newOrder.attachment = attachment;
        }
        this.updateOrder.emit(this.newOrder);
      }
      this.isReferenceFileChanged = false;
      setTimeout(() => this.saving = false);
    });
  }

  getContactName(people: People) {
    return PeopleUtils.getName(people);
  }

  addReportDestination(repDest: ReportDestination) {
    this.order.reportDestinations.push(repDest);
    this.infoService.displaySaveSuccess();
  }

  updateReportDestination(repDest: ReportDestination) {
    this.order.reportDestinations[this.order.reportDestinations.findIndex(r => r.uuid === repDest.uuid)] = repDest;
    this.infoService.displaySaveSuccess();
  }

  removeReportDestination(repDest: ReportDestination) {
    this.ordersService.removeReportDestination(repDest.uuid).subscribe((done) => {
      if (done) {
        this.order.reportDestinations = this.order.reportDestinations.filter(r => r.uuid !== repDest.uuid);
        this.infoService.displaySaveSuccess();
      }
    });
  }

  getDestinationName(destination: ReportDestination) {
    return (new ReportDestinationDisplay(destination)).display();
  }
}
