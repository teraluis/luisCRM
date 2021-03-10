import {Order} from '../../services/backend/orders.service';

export class OrderUtils {

  public static emptyOrder: Order = {
    account: undefined,
    adviceVisit: undefined,
    assessment: undefined,
    commentary: undefined,
    commercial: undefined,
    created: undefined,
    deadline: undefined,
    description: undefined,
    establishment: undefined,
    estimate: undefined,
    market: undefined,
    name: undefined,
    orderLines: [],
    purchaserContact: undefined,
    received: undefined,
    referenceFile: undefined,
    referenceNumber: undefined,
    reportDestinations: [],
    status: undefined,
    uuid: undefined,
    workdescription: undefined,
    attachment: undefined,
    agency: undefined
  };

  public static buildOrder(order?: Order): Order {
    return order ? {
      account: order.account,
      adviceVisit: order.adviceVisit,
      assessment: order.assessment,
      commentary: order.commentary,
      commercial: order.commercial,
      created: order.created,
      deadline: order.deadline,
      description: order.description,
      establishment: order.establishment,
      estimate: order.estimate,
      market: order.market,
      name: order.name,
      orderLines: order.orderLines,
      purchaserContact: order.purchaserContact,
      received: order.received,
      referenceFile: order.referenceFile,
      referenceNumber: order.referenceNumber,
      reportDestinations: order.reportDestinations,
      status: order.status,
      uuid: order.uuid,
      workdescription: order.workdescription,
      attachment: order.attachment,
      agency: order.agency
    } : this.buildOrder(this.emptyOrder);
  }

  public static buildUpdateForm(order: Order, file: File): FormData {
    let date: Date;
    if (isNaN(Number(order.received))) {
      date = new Date(order.received);
      order.received = date.getTime();
    }
    if (isNaN(Number(order.deadline))) {
      date = new Date(order.deadline);
      order.deadline = date.getTime();
    }
    if (order.adviceVisit && isNaN(Number(order.adviceVisit))) {
      date = new Date(order.adviceVisit);
      order.adviceVisit = date.getTime();
    }
    if (order.assessment && isNaN(Number(order.assessment))) {
      date = new Date(order.assessment);
      order.assessment = date.getTime();
    }
    const formData: FormData = new FormData();
    if (file) {
      formData.append('referencefilecontent', file, file.name);
      formData.append('content-type', file.type);
    }
    formData.append('name', order.name);
    formData.append('status', order.status);
    formData.append('account', order.account.uuid);
    if (order.referenceNumber) {
      formData.append('referenceNumber', order.referenceNumber);
    }
    if (order.referenceFile) {
      formData.append('referenceFile', order.referenceFile);
    }
    if (order.market) {
      console.log('orderMarket', order.market);
      formData.append('market', order.market.uuid);
    }
    if (order.estimate) {
      formData.append('estimate', order.estimate.uuid);
    }
    if (order.received) {
      formData.append('received', order.received.toString());
    }
    if (order.deadline) {
      formData.append('deadline', order.deadline.toString());
    }
    if (order.adviceVisit) {
      formData.append('adviceVisit', order.adviceVisit.toString());
    }
    if (order.assessment) {
      formData.append('assessment', order.assessment.toString());
    }
    if (order.description) {
      formData.append('description', order.description);
    }
    if (order.workdescription) {
      formData.append('workdescription', order.workdescription);
    }
    if (order.commentary) {
      formData.append('commentary', order.commentary);
    }
    if (order.establishment && order.establishment.establishment.uuid) {
      formData.append('establishment', order.establishment.establishment.uuid);
    }
    if (order.purchaserContact) {
      formData.append('purchaserContact', order.purchaserContact.uuid);
    }
    if (order.commercial) {
      formData.append('commercial', order.commercial.login);
    }
    if (order.agency) {
      formData.append('agency', order.agency.uuid);
    }
    if (order.billedEstablishment) {
      formData.append('billedEstablishment', order.billedEstablishment.uuid);
    }
    if (order.billedContact) {
      formData.append('billedContact', order.billedContact.uuid);
    }
    if (order.payerEstablishment) {
      formData.append('payerEstablishment', order.payerEstablishment.uuid);
    }
    if (order.payerContact) {
      formData.append('payerContact', order.payerContact.uuid);
    }
    return formData;
  }

  public static getStatus(status: OrderStatusLabel) {
    switch (status) {
      case OrderStatusLabel.RECEIVED:
        return OrderStatus.RECEIVED;
      case OrderStatusLabel.FILLED:
        return OrderStatus.FILLED;
      case OrderStatusLabel.CLOSED:
        return OrderStatus.CLOSED;
      case OrderStatusLabel.HONORED:
        return OrderStatus.HONORED;
      case OrderStatusLabel.BILLABLE:
        return OrderStatus.BILLABLE;
      case OrderStatusLabel.PRODUCTION:
        return OrderStatus.PRODUCTION;
      case OrderStatusLabel.CANCELED:
        return OrderStatus.CANCELED;
      default:
        return -1;
    }
  }

  public static getStatusColor(key: OrderStatus) {
    switch (key) {
      case OrderStatus.FILLED:
      case OrderStatus.PRODUCTION:
      case OrderStatus.HONORED:
      case OrderStatus.CLOSED:
        return 'green';
      case OrderStatus.RECEIVED:
      case OrderStatus.BILLABLE:
        return 'warn';
      case OrderStatus.CANCELED:
        return 'red';
      default:
        return 'grey';
    }
  }

  public static getStatusName(key: OrderStatus) {
    switch (key) {
      case OrderStatus.RECEIVED:
        return 'Commande reçue';
      case OrderStatus.FILLED:
        return 'Commande renseignée';
      case OrderStatus.PRODUCTION:
        return 'Commande en production';
      case OrderStatus.BILLABLE:
        return 'Commande facturable';
      case OrderStatus.HONORED:
        return 'Commande honorée';
      case OrderStatus.CLOSED:
        return 'Commande clôturée';
      case OrderStatus.CANCELED:
        return 'Commande annulée';
      default:
        return 'Etat inconnu';
    }
  }
}

export enum OrderStatus {
  RECEIVED,
  FILLED,
  PRODUCTION,
  BILLABLE,
  HONORED,
  CLOSED,
  CANCELED
}

export enum OrderStatusLabel {
  RECEIVED = 'received',
  FILLED = 'filled',
  PRODUCTION = 'production',
  BILLABLE = 'billable',
  HONORED = 'honored',
  CLOSED = 'closed',
  CANCELED = 'canceled'
}
