import {Injectable} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {error} from 'util';
import {OrdersService, ReportDestinationDisplay} from '../backend/orders.service';
import {Prestation, PrestationsService} from '../backend/prestations.service';
import {SortService} from './sort.service';
import {InterventionsService} from '../backend/interventions.service';
import {DatePipe} from '@angular/common';
import {AccountsService} from '../backend/accounts.service';
import {Estate, EstatesService, Premises} from '../backend/estates.service';
import {Address, AddressesService} from '../backend/addresses.service';
import {People} from '../backend/people.service';
import {MarketsTableLine} from '../../modules/markets/markets.component';
import {EstateTableLine} from '../../modules/estates/estates.component';
import {AccountUtils} from '../../modules/utils/account-utils';
import {PeopleUtils} from '../../modules/utils/people-utils';
import {EstablishmentsService} from '../backend/establishments.service';
import {TechnicalActService} from '../backend/technical-act.service';
import {EstateUtils} from '../../modules/utils/estate-utils';
import {AllBillTableLine} from '../../modules/order/order-bill/order-bill.component';

@Injectable()
export class SidePanelService {
  private sidePanel: MatSidenav;
  private titles = [
    {value: SidePanelType.REP_DEST, title: 'Informations sur le contact'},
    {value: SidePanelType.CONTACT, title: 'Informations sur le contact'},
    {value: SidePanelType.ESTATE, title: 'Informations sur le bien'},
    {value: SidePanelType.ORDER, title: 'Informations sur la commande'},
    {value: SidePanelType.INTERVENTION, title: 'Informations sur l\'intervention'},
    {value: SidePanelType.BILL, title: 'Informations sur la facture'},
    {value: SidePanelType.ACCOUNT, title: 'Informations sur le compte'},
    {value: SidePanelType.MARKET, title: 'Informations sur le marché'},
    {value: SidePanelType.INDIVIDUAL, title: 'Informations sur le particulier'},
    {value: SidePanelType.ESTABLISHMENT, title: 'Informations sur l\'établissement'},
  ];
  public isLoading = false;
  public title: string;
  public content: SidePanelElement[];

  constructor(private ordersService: OrdersService,
              private accountsService: AccountsService,
              private estatesService: EstatesService,
              private prestationsService: PrestationsService,
              private interventionsService: InterventionsService,
              private establishmentsService: EstablishmentsService,
              private sortService: SortService,
              private datepipe: DatePipe,
              private addressesService: AddressesService,
              private technicalActService: TechnicalActService) {
  }

  public setSidePanel(sidePanel: MatSidenav) {
    this.sidePanel = sidePanel;
  }

  public open() {
    return this.sidePanel.open();
  }

  public close() {
    return this.sidePanel.close();
  }

  public toggle(type: SidePanelType, content: any) {
    if (!content) {
      this.close();
      this.content = [];
      this.title = '';
    } else {
      this.setContent(type, content);
      this.open();
    }
  }

  public setContent(type: SidePanelType, content: any) {
    this.content = [];
    switch (type) {
      case SidePanelType.REP_DEST:
        this.buildReportDestinationInfo(content);
        break;
      case SidePanelType.ESTATE:
        this.getAndBuildEstateInfo(content);
        break;
      case SidePanelType.BILL:
        this.buildBillInfo(content);
        break;
      case SidePanelType.MARKET:
        this.buildMarketInfo(content);
        break;
      case SidePanelType.CONTACT:
        this.buildContactInfo(content);
        break;
      default:
        throw error('The type of content is not supported by the SidePanelService');
    }
    const title = this.titles.filter(e => e.value === type)[0];
    this.title = title ? title.title : 'Prévisualisation';
  }

  buildMarketInfo(content: MarketsTableLine) {
    this.content.push({
      dividerTitle: 'Marché',
      isLoading: true,
      infos: []
    });
    this.content.push({
      dividerTitle: 'Informations complémentaires',
      isLoading: true,
      infos: []
    });
    // Marche
    let values: PanelInfo[] = [];
    values.push({label: 'Nom', value: content.name});
    values.push({label: 'Référence', value: content.marketNumber});
    if (content.startDate) {
      values.push({label: 'Date de début', value: content.startDate});
    }
    if (content.duration) {
      values.push({label: 'Durée', value: content.duration});
    }
    if (content.customerRequirement) {
      values.push({label: 'Type de besoin client', value: content.customerRequirement});
    }
    if (content.estimateVolume) {
      values.push({label: 'Estimation', value: content.estimateVolume});
    }
    this.content.filter(c => c.dividerTitle === 'Marché')[0].infos = values;
    this.content.filter(c => c.dividerTitle === 'Marché')[0].isLoading = false;
    // Information
    values = [];
    if (content.receiveDate) {
      values.push({label: 'Date de réception', value: content.receiveDate});
    }
    if (content.responseDate) {
      values.push({label: 'Date de réponse', value: content.responseDate});
    }
    if (content.returnDate) {
      values.push({label: 'Date de retour', value: content.returnDate});
    }
    if (content.publicationNumber) {
      values.push({label: 'N° de parution', value: content.publicationNumber});
    }
    if (content.origin) {
      values.push({label: 'Provenance', value: content.origin});
    }
    this.content.filter(c => c.dividerTitle === 'Informations complémentaires')[0].infos = values;
    this.content.filter(c => c.dividerTitle === 'Informations complémentaires')[0].isLoading = false;
  }

  private buildBillInfo(content: AllBillTableLine) {
    this.content.push({
      dividerTitle: undefined,
      isLoading: false,
      infos: []
    });
  }

  private buildContactInfo(content: People) {
    this.content.push({
      dividerTitle: undefined,
      isLoading: false,
      infos: []
    });
  }

  // private buildOrderInfo(content: OrderTableLine, technicalAct: TechnicalAct[]) {
  //   this.content.push({
  //     dividerTitle: 'Compte',
  //     isLoading: true,
  //     infos: []
  //   });
  //   this.content.push({
  //     dividerTitle: 'Description',
  //     isLoading: true,
  //     infos: []
  //   });
  //   this.content.push({
  //     dividerTitle: 'Biens',
  //     isLoading: true,
  //     infos: []
  //   });
  //   this.content.push({
  //     dividerTitle: 'Prestations',
  //     isLoading: true,
  //     infos: []
  //   });
  //   // Compte
  //   let values: PanelInfo[] = [];
  //   const market = content.order.market;
  //   values.push({
  //     label: 'Compte',
  //     value: market ? market.marketAccounts[0].account.entity.name : PeopleUtils.getName(content.order.purchaser.contact)
  //   });
  //   if (market && market.name) {
  //     values.push({label: 'Marché', value: market.name + (market.marketNumber ? ' - ' + market.marketNumber : '')});
  //   }
  //   if (content.order.establishment) {
  //     let address = content.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.BILLING);
  //     address = address ? address : content.order.establishment.addresses.find(a => a.role === EstablishmentAddressRole.MAIN);
  //     values.push({label: 'Établissement', value: content.order.establishment.establishment.name});
  //     values.push({label: 'Addresse de facturation', value: AddressUtils.getName(address.address)});
  //     values.push({label: 'Localité', value: AddressUtils.getLocality(address.address)});
  //   } else {
  //     let address = content.order.purchaser.contact.addresses.find(a => a.role === PeopleAddressRole.BILLING);
  //     address = address ? address : content.order.purchaser.contact.addresses.find(a => a.role === PeopleAddressRole.MAIN);
  //     values.push({label: 'Addresse de facturation', value: AddressUtils.getName(address.address)});
  //     values.push({label: 'Ville', value: AddressUtils.getLocality(address.address)});
  //   }
  //   const purchaser = AccountUtils.getName(content.order.purchaser);
  //   values.push({label: 'Donneur d\'ordre', value: purchaser});
  //   if (content.order.establishment) {
  //     values.push({
  //       label: 'Commercial',
  //       value: content.order.establishment.account.commercial.first_name + ' ' + content.order.establishment.account.commercial.last_name.toUpperCase()
  //     });
  //   }
  //   this.content.filter(c => c.dividerTitle === 'Compte')[0].infos = values;
  //   this.content.filter(c => c.dividerTitle === 'Compte')[0].isLoading = false;
  //   values = [];
  //   // Description
  //   if (content.order.referenceNumber) {
  //     values.push({label: 'No. bon de commande client', value: content.order.referenceNumber});
  //   }
  //   if (content.order.received) {
  //     values.push({label: 'Date de réception', value: new Date(content.order.received).toLocaleDateString()});
  //   }
  //   if (content.order.adviceVisit) {
  //     values.push({label: 'Date limite de livraison', value: new Date(content.order.adviceVisit).toLocaleDateString()});
  //   }
  //   if (content.order.deadline) {
  //     values.push({label: 'Date de visite conseil', value: new Date(content.order.deadline).toLocaleDateString()});
  //   }
  //   if (content.order.assessment) {
  //     values.push({label: 'Date de l\'état des lieux', value: new Date(content.order.assessment).toLocaleDateString()});
  //   }
  //   this.content.filter(c => c.dividerTitle === 'Description')[0].infos = values;
  //   this.content.filter(c => c.dividerTitle === 'Description')[0].isLoading = false;
  //   values = [];
  //   // Start loading Estate
  //   this.prestationsService.getFromOrder(content.id).subscribe((prestations) => {
  //     if (!prestations) {
  //       this.content.filter(c => c.dividerTitle === 'Biens')[0].isLoading = false;
  //       this.content.filter(c => c.dividerTitle === 'Prestations')[0].isLoading = false;
  //     } else {
  //       // Prestations
  //       const checkedPrestations = [];
  //       const prestationTypes: CheckPrestationType[] = [];
  //       for (const t of technicalAct) {
  //         prestationTypes.push(new CheckPrestationType(t, false));
  //       }
  //       prestationTypes.sort((a, b) => {
  //         return this.sortService.sortPrestationTypes(a.prestationTypeInput, b.prestationTypeInput);
  //       });
  //       for (const prestation of prestations) {
  //         for (const prestationType of prestationTypes) {
  //           if (prestation.technicalAct && prestationType.prestationTypeInput.uuid === prestation.technicalAct.uuid) {
  //             checkedPrestations.push(prestationType.prestationTypeInput.shortcut);
  //           }
  //         }
  //       }
  //       technicalAct.forEach((type: TechnicalAct) => {
  //         const nbPrestations = checkedPrestations.filter(p => p === type.shortcut).length;
  //         if (nbPrestations) {
  //           values.push({label: type.shortcut, value: nbPrestations});
  //         }
  //       });
  //       this.content.filter(c => c.dividerTitle === 'Prestations')[0].infos = values;
  //       this.content.filter(c => c.dividerTitle === 'Prestations')[0].isLoading = false;
  //       // Nb Bien
  //       values = [];
  //       const estateIds = [];
  //       prestations.forEach(p => {
  //         if (p.estate && !estateIds.includes(p.estate)) {
  //           estateIds.push(p.estate);
  //         }
  //       });
  //       if (estateIds && estateIds.length) {
  //         forkJoin(estateIds.map(estate => this.estatesService.get(estate))).subscribe((estates) => {
  //           if (!estates) {
  //             this.content.filter(c => c.dividerTitle === 'Biens')[0].isLoading = false;
  //           } else {
  //             values.push({label: 'Nombre de biens', value: estates.length});
  //             values.push({
  //               label: 'Référence des biens',
  //               value: estates.map(e => e.estateReference ? e.estateReference : e.adxReference).join(', ')
  //             });
  //             this.content.filter(c => c.dividerTitle === 'Biens')[0].infos = values;
  //             this.content.filter(c => c.dividerTitle === 'Biens')[0].isLoading = false;
  //           }
  //         });
  //       } else {
  //         this.content.filter(c => c.dividerTitle === 'Biens')[0].isLoading = false;
  //       }
  //     }
  //   });
  // }

  getAndBuildEstateInfo(estate: EstateTableLine) {
    this.content.push({
      dividerTitle: undefined,
      isLoading: true,
      infos: []
    });
    this.estatesService.get(estate.id).subscribe((e) => {
      if (!e) {
        console.log('An error occurred while retrieving estate ' + estate.id);
        this.content.filter(c => c.dividerTitle === 'Biens')[0].isLoading = false;
      } else {
        this.buildEstateInfo(e);
      }
    });
  }

  private buildEstateInfo(estate: Estate, prestation?: Prestation) {
    const values: PanelInfo[] = [];
    values.push({label: 'Client', value: EstateUtils.getOwnerName(estate)});
    values.push({label: 'Référence', value: estate.estateReference ? estate.estateReference : estate.adxReference});
    values.push({label: 'Type de bien', value: estate.customEstateType ? estate.customEstateType : estate.estateType.type});
    if (estate.localities.length > 0 && estate.localities[0].addresses.length > 0) {
      const address: Address = EstateUtils.getAddressFromPrestation(estate, prestation);
      if (address.postCode && address.city) {
        values.push({label: 'Ville', value: address.postCode + ' ' + address.city});
      }
      if (address.address1) {
        values.push({label: 'Adresse', value: address.address1});
      }
      if (address.address2) {
        values.push({label: 'Complément', value: address.address2});
      }
      if (address.gpsCoordinates) {
        values.push({label: 'GPS: ', value: address.gpsCoordinates});
      }
      if (address.inseeCoordinates) {
        values.push({label: 'INSEE: ', value: address.inseeCoordinates});
      }
      if (estate.localities[0].premises.length > 0) {
        const premises: Premises = estate.localities[0].premises[0];
        if (premises.number) {
          values.push({label: 'No. de logement', value: premises.number});
        }
        if (premises.floor) {
          values.push({label: 'Étage', value: premises.floor});
        }
      }
      this.content.filter(c => c.dividerTitle === 'Bien' || c.dividerTitle === undefined)[0].infos = values;
      this.content.filter(c => c.dividerTitle === 'Bien' || c.dividerTitle === undefined)[0].isLoading = false;
    } else {
      this.content.filter(c => c.dividerTitle === 'Bien' || c.dividerTitle === undefined)[0].infos = values;
      this.content.filter(c => c.dividerTitle === 'Bien' || c.dividerTitle === undefined)[0].isLoading = false;
    }
  }

  private buildReportDestinationInfo(reportDest: ReportDestinationDisplay) {
    this.content.push({
      dividerTitle: undefined,
      isLoading: true,
      infos: []
    });
    const values: PanelInfo[] = [];
    /*if (reportDest.reportDestination.people) {
      values.push({label: 'Nom', value: PeopleUtils.getName(reportDest.reportDestination.people)});
    }
    if (reportDest.reportDestination.zip && reportDest.reportDestination.city) {
      values.push({label: 'Ville', value: reportDest.reportDestination.zip + ' ' + reportDest.reportDestination.city});
    }
    if (reportDest.reportDestination.address1) {
      values.push({label: 'Adresse', value: reportDest.reportDestination.address1});
    }
    if (reportDest.reportDestination.address2) {
      values.push({label: 'Complément', value: reportDest.reportDestination.address2});
    }
    if (reportDest.reportDestination.people) {
      if (reportDest.reportDestination.people.email) {
        values.push({label: 'Email', value: reportDest.reportDestination.people.email});
      }
      if (reportDest.reportDestination.people.mobilePhone) {
        values.push({label: 'Téléphone', value: reportDest.reportDestination.people.mobilePhone});
      }
      if (reportDest.reportDestination.people.jobDescription) {
        values.push({label: 'Rôle', value: reportDest.reportDestination.people.jobDescription});
      }
    } else {
      if (reportDest.reportDestination.mail) {
        values.push({label: 'Email', value: reportDest.reportDestination.mail});
      }
      if (reportDest.reportDestination.url) {
        values.push({label: 'Url', value: reportDest.reportDestination.url});
      }
    }
    if (reportDest.reportDestination.account) {
      values.push({label: 'Compte', value: AccountUtils.getName(reportDest.reportDestination.account)});
    }*/
    this.content.filter(c => c.dividerTitle === undefined)[0].infos = values;
    this.content.filter(c => c.dividerTitle === undefined)[0].isLoading = false;
  }

  secondsToHumanReadable(seconds: number) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }

  getDateFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    return this.datepipe.transform(date, 'dd/MM/yyyy');
  }

  getTimeFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    return this.datepipe.transform(date, 'HH:mm');
  }
}

export interface SidePanelElement {
  dividerTitle: string;
  isLoading: boolean;
  infos: PanelInfo[];
}

export interface PanelInfo {
  label: string;
  value: string | number | Date;
}

export enum SidePanelType {
  REP_DEST,
  CONTACT,
  ORDER,
  INTERVENTION,
  BILL,
  ACCOUNT,
  ESTATE,
  LOCALITY,
  PREMISES,
  ANNEX,
  MARKET,
  INDIVIDUAL,
  ESTABLISHMENT
}
