import {Annex, Estate, EstateState, Locality, Premises} from '../../services/backend/estates.service';
import {AddressUtils} from './address-utils';
import {Address} from '../../services/backend/addresses.service';
import {Prestation, PrestationEstateType} from '../../services/backend/prestations.service';
import {AccountUtils} from "./account-utils";

export class EstateUtils {

  public static emptyEstate: Estate = {
    establishment: undefined,
    account: undefined,
    adxReference: undefined,
    attachments: [],
    customEstateType: undefined,
    deleted: false,
    estateReference: undefined,
    estateType: undefined,
    id: undefined,
    localities: [],
    name: undefined,
    state: EstateState.INCOMPLETE
  };

  public static emptyLocality: Locality = {
    addresses: [],
    annexes: [],
    buildingPermitDate: undefined,
    cadastralReference: undefined,
    condominium: undefined,
    constructionDate: undefined,
    creationDate: undefined,
    customHeatingType: undefined,
    deleted: false,
    floorQ: undefined,
    heatingType: undefined,
    id: undefined,
    inseeCoordinates: undefined,
    name: 'N/A',
    premises: []
  };

  public static emptyPremises: Premises = {
    area: undefined,
    customHeatingType: undefined,
    customPremisesType: undefined,
    deleted: false,
    floor: 'N/A',
    heatingType: undefined,
    id: undefined,
    contact: undefined,
    number: 'N/A',
    premisesType: undefined,
    premisesReference: undefined,
    releaseDate: undefined
  };

  public static emptyAnnex: Annex = {
    annexType: undefined,
    area: undefined,
    customAnnexType: undefined,
    deleted: false,
    floor: undefined,
    id: undefined,
    isCommonArea: undefined,
    annexReference: undefined
  };

  private static generateName(prefix: string): string { // TODO: check if ref do not exist
    let name = prefix;
    for (let i = 0; i < 7; i++) {
      const rand = Math.floor(Math.random() * 10);
      name = name + rand.toString();
    }
    return name;
  }

  public static buildEstate(estate?: Estate): Estate {
    const ref = this.generateName('B');
    return estate ? {
      establishment: estate.establishment,
      account: estate.account,
      adxReference: estate.adxReference ? estate.adxReference : ref,
      attachments: estate.attachments,
      customEstateType: estate.customEstateType,
      deleted: estate.deleted,
      estateReference: estate.estateReference,
      estateType: estate.estateType,
      id: estate.id,
      localities: estate.localities,
      name: estate.name ? estate.name : 'Bien ' + ref,
      state: estate.state
    } : this.buildEstate(this.emptyEstate);
  }

  public static buildLocality(locality?: Locality): Locality {
    return locality ? {
      addresses: locality.addresses,
      annexes: locality.annexes,
      buildingPermitDate: locality.buildingPermitDate,
      cadastralReference: locality.cadastralReference,
      condominium: locality.condominium,
      constructionDate: locality.constructionDate,
      creationDate: locality.creationDate,
      customHeatingType: locality.customHeatingType,
      deleted: locality.deleted,
      floorQ: locality.floorQ,
      heatingType: locality.heatingType,
      id: locality.id,
      inseeCoordinates: locality.inseeCoordinates,
      name: locality.name,
      premises: locality.premises
    } : this.buildLocality(this.emptyLocality);
  }

  public static buildPremises(premises?: Premises): Premises {
    return premises ? {
      area: premises.area,
      customHeatingType: premises.customHeatingType,
      customPremisesType: premises.customPremisesType,
      deleted: premises.deleted,
      floor: premises.floor,
      heatingType: premises.heatingType,
      id: premises.id,
      contact: premises.contact,
      number: premises.number,
      premisesType: premises.premisesType,
      premisesReference: premises.premisesReference,
      releaseDate: premises.releaseDate
    } : this.buildPremises(this.emptyPremises);
  }

  public static buildAnnex(annex?: Annex): Annex {
    return annex ? {
      annexType: annex.annexType,
      area: annex.area,
      customAnnexType: annex.customAnnexType,
      deleted: annex.deleted,
      floor: annex.floor,
      id: annex.id,
      isCommonArea: annex.isCommonArea,
      annexReference: annex.annexReference
    } : this.buildAnnex(this.emptyAnnex);
  }

  public static duplicate(estate: Estate): Estate {
    const duplicate: Estate = this.buildEstate();
    if (estate) {
      // Values to duplicate
      duplicate.establishment = estate.establishment;
      duplicate.account = estate.account;
      duplicate.customEstateType = estate.customEstateType;
      duplicate.estateType = estate.estateType;
      duplicate.localities = estate.localities ? estate.localities.map(loc => this.duplicateLocality(loc)) : [];
    }
    return duplicate;
  }

  public static duplicateLocality(locality: Locality): Locality {
    const duplicate: Locality = this.buildLocality();
    if (locality) {
      // Values to duplicate
      duplicate.addresses = locality.addresses ? locality.addresses.map(a => AddressUtils.duplicate(a)) : [];
      duplicate.annexes = locality.annexes ? locality.annexes.map(a => this.duplicateAnnex(a)) : [];
      duplicate.premises = locality.premises ? locality.premises.map(p => this.duplicatePremises(p)) : [];
      duplicate.buildingPermitDate = locality.buildingPermitDate;
      duplicate.condominium = locality.condominium;
      duplicate.constructionDate = locality.constructionDate;
      duplicate.customHeatingType = locality.customHeatingType;
      duplicate.floorQ = locality.floorQ;
      duplicate.heatingType = locality.heatingType;
      duplicate.inseeCoordinates = locality.inseeCoordinates;
      duplicate.name = locality.name;
    }
    return duplicate;
  }

  public static duplicatePremises(premises: Premises): Premises {
    const duplicate: Premises = this.buildPremises();
    if (premises) {
      // Values to duplicate
      duplicate.area = premises.area;
      duplicate.customHeatingType = premises.customHeatingType;
      duplicate.customPremisesType = premises.customPremisesType;
      duplicate.floor = premises.floor;
      duplicate.heatingType = premises.heatingType;
      duplicate.contact = premises.contact;
      duplicate.premisesType = premises.premisesType;
      duplicate.releaseDate = premises.releaseDate;
    }
    return duplicate;
  }

  public static duplicateAnnex(annex: Annex): Annex {
    const duplicate: Annex = this.buildAnnex();
    if (annex) {
      // Values to duplicate
      duplicate.annexType = annex.annexType;
      duplicate.area = annex.area;
      duplicate.customAnnexType = annex.customAnnexType;
      duplicate.isCommonArea = annex.isCommonArea;
    }
    return duplicate;
  }

  public static getStatusName(key: number | string) {
    switch (Number(key)) {
      case EstateState.INACTIVE:
        return 'Inactif';
      case EstateState.ACTIVE:
        return 'Actif';
      case EstateState.INCOMPLETE:
        return 'Incomplet';
      case EstateState.COMPLETE:
        return 'Complet';
      default:
        return 'Etat inconnu';
    }
  }

  public static getStatusColor(key: number | string) {
    switch (Number(key)) {
      case EstateState.INACTIVE:
        return 'red';
      case EstateState.ACTIVE:
        return 'green';
      case EstateState.INCOMPLETE:
        return 'warn';
      case EstateState.COMPLETE:
        return 'blue';
      default:
        return 'grey';
    }
  }

  public static getTypeDisplay(estate: Estate) {
    if (!estate || estate.customEstateType) {
      return EstateTypeDisplay.UNKNOWN;
    } else {
      switch (estate.estateType.id) {
        case 'estate_type-61bac930-fe8b-49d0-897b-826f80ea7855': // Immeuble
          return EstateTypeDisplay.BUILDING;
        case 'estate_type-853b9dbf-3af1-4cd9-983f-8cbef6c69e73': // Appartement
        case 'estate_type-9efc8dbf-611e-437a-8dbe-97a66e3e58ad': // Bureau
        case 'estate_type-d280c08e-24a8-4fc3-bc1e-94e63a3ed06f': // Maison
          return EstateTypeDisplay.HOUSE;
        case 'estate_type-808220e5-1c40-441b-8114-660fed0e9ccb': // Agricole
        case 'estate_type-8572825c-d396-4f67-961d-77057f5bf398': // Artisanat
        case 'estate_type-138a69d2-e05a-49aa-8c7b-2abc0f9cb413': // Commerce
        case 'estate_type-5ef63d98-a4a2-4091-9a46-fa96dbf2aa34': // Crèche
        case 'estate_type-5df7b56d-48ab-4089-bd90-383828f64dac': // Enseignement primaire
        case 'estate_type-633f55cd-af55-4ab3-8e26-00bccbd9e1b6': // Enseignement secondaire
        case 'estate_type-b1177432-5949-42a7-8227-fc2f8c0d6a30': // Etablissements sanitaires
        case 'estate_type-9d851ee9-700b-4b7b-961d-d258225e56a4': // Garage automobile
        case 'estate_type-18f69977-5175-4df1-96bd-24497a36c7be': // Industrie
        case 'estate_type-4411137e-07a5-4ddf-b92d-f7f29d0cb438': // Non communiqué
        case 'estate_type-ea2a211d-3589-4575-864d-bffc596ec94c': // Site
        case 'estate_type-4ec79da9-ef28-4a30-b230-beb1d701ab85': // Autre
          return EstateTypeDisplay.DEFAULT;
        default:
          return EstateTypeDisplay.UNKNOWN;
      }
    }
  }

  public static getPremisesLabel(estate: Estate, plural?: boolean) {
    if (!estate) {
      return '';
    } else if (estate.customEstateType) {
      return plural ? 'Locaux' : 'Local';
    } else {
      switch (estate.estateType.id) {
        case 'estate_type-61bac930-fe8b-49d0-897b-826f80ea7855': // Immeuble
          return plural ? 'Appartements' : 'Appartement';
        case 'estate_type-853b9dbf-3af1-4cd9-983f-8cbef6c69e73': // Appartement
          return 'Appartement';
        case 'estate_type-9efc8dbf-611e-437a-8dbe-97a66e3e58ad': // Bureau
          return 'Bureau';
        case 'estate_type-d280c08e-24a8-4fc3-bc1e-94e63a3ed06f': // Maison
          return 'Maison';
        case 'estate_type-808220e5-1c40-441b-8114-660fed0e9ccb': // Agricole
        case 'estate_type-8572825c-d396-4f67-961d-77057f5bf398': // Artisanat
        case 'estate_type-138a69d2-e05a-49aa-8c7b-2abc0f9cb413': // Commerce
        case 'estate_type-5ef63d98-a4a2-4091-9a46-fa96dbf2aa34': // Crèche
        case 'estate_type-5df7b56d-48ab-4089-bd90-383828f64dac': // Enseignement primaire
        case 'estate_type-633f55cd-af55-4ab3-8e26-00bccbd9e1b6': // Enseignement secondaire
        case 'estate_type-b1177432-5949-42a7-8227-fc2f8c0d6a30': // Etablissements sanitaires
        case 'estate_type-9d851ee9-700b-4b7b-961d-d258225e56a4': // Garage automobile
        case 'estate_type-18f69977-5175-4df1-96bd-24497a36c7be': // Industrie
        case 'estate_type-4411137e-07a5-4ddf-b92d-f7f29d0cb438': // Non communiqué
        case 'estate_type-ea2a211d-3589-4575-864d-bffc596ec94c': // Site
        case 'estate_type-4ec79da9-ef28-4a30-b230-beb1d701ab85': // Autre
          return plural ? 'Locaux' : 'Local';
        default:
          return plural ? 'Locaux' : 'Local';
      }
    }
  }

  public static getEstateIcon(estate: Estate) {
    switch (EstateUtils.getTypeDisplay(estate)) {
      case EstateTypeDisplay.BUILDING:
        return EstateIcon.BUILDING;
      case EstateTypeDisplay.HOUSE:
        return EstateIcon.HOUSE;
      case EstateTypeDisplay.DEFAULT:
        return EstateIcon.DEFAULT;
      case EstateTypeDisplay.UNKNOWN:
      default:
        return EstateIcon.UNKNOWN;
    }
  }

  public static sortByFloor(a: Annex | Premises, b: Annex | Premises) {
    if (a.floor && b.floor) {
      const c1 = a.floor === 'RDC' ? String('0').charCodeAt(0) : String(a.floor).charCodeAt(0);
      const c2 = b.floor === 'RDC' ? String('0').charCodeAt(0) : String(b.floor).charCodeAt(0);
      let result = c1 - c2;
      if (result === 0 && (a.floor.length > 1 || b.floor.length > 1)) {
        if (a.floor === 'RDC' || b.floor === 'RDC') {
          result = b.floor.length - a.floor.length;
        } else if ((a.floor.length > 2 && a.floor[1] === ',') || (b.floor.length > 2 && b.floor[1] === ',')) {
          result = a.floor.length - b.floor.length;
          if (result === 0) {
            result = String(a.floor).charCodeAt(2) - String(b.floor).charCodeAt(2);
          }
        } else {
          result = a.floor.length - b.floor.length;
        }
      }
      return result;
    } else if (a.floor) {
      return 1;
    } else {
      return -1;
    }
  }

  public static getAddressFromPrestation(estate: Estate, prestation: Prestation): Address {
    if (!estate || estate.localities.length === 0) {
      return null;
    } else if (!prestation || !prestation.targetId || !prestation.estate || !prestation.estateType) {
      return estate.localities[0].addresses[0];
    } else {
      let address: Address;
      switch (prestation.estateType) {
        case PrestationEstateType.PREMISES:
          estate.localities.forEach((locality) => {
              address = !address && locality.premises.find(p => p.id === prestation.targetId) ? locality.addresses[0] : address;
          });
          break;
        case PrestationEstateType.ANNEX:
          estate.localities.forEach((locality) => {
            address = !address && locality.annexes.find(a => a.id === prestation.targetId) ? locality.addresses[0] : address;
          });
          break;
        default:
          break;
      }
      return address ? address : estate.localities[0].addresses[0];
    }
  }

  public static getReferenceFromPrestation(estate: Estate, prestation: Prestation): string {
    if (!estate || estate.localities.length === 0) {
      return null;
    } else if (!prestation || !prestation.targetId || !prestation.estate || !prestation.estateType) {
      return estate.estateReference ? estate.estateReference : estate.adxReference;
    } else {
      let reference: string;
      switch (prestation.estateType) {
        case PrestationEstateType.PREMISES:
          estate.localities.forEach((locality) => {
            const tmp = locality.premises.find(p => p.id === prestation.targetId);
            reference = !reference && tmp ? tmp.premisesReference : reference;
          });
          break;
        case PrestationEstateType.ANNEX:
          estate.localities.forEach((locality) => {
            const tmp = locality.annexes.find(a => a.id === prestation.targetId);
            reference = !reference && tmp ? tmp.annexReference : reference;
          });
          break;
        default:
          break;
      }
      return reference ? reference : (estate.estateReference ? estate.estateReference : estate.adxReference);
    }
  }

  public static getLocalityFromId(estate: Estate, id: string): Locality {
    return !estate || estate.localities.length === 0 || !id ? null
      : estate.localities.find((locality) => locality.id === id);
  }

  public static getLocalityFromPremisesId(estate: Estate, id: string): Locality {
    return !estate || estate.localities.length === 0 || !id ? null
      : estate.localities.find((locality) => locality.premises.map(a => a.id).includes(id));
  }

  public static getLocalityFromAnnexId(estate: Estate, id: string): Locality {
    return !estate || estate.localities.length === 0 || !id ? null
      : estate.localities.find((locality) => locality.annexes.map(a => a.id).includes(id));
  }

  public static getPremisesFromId(estate: Estate, id: string): Premises {
    if (!estate || estate.localities.length === 0 || !id) {
      return null;
    } else {
      let premises: Premises = null;
      estate.localities.forEach((locality) => {
        const tmp = locality.premises.find((p) => p.id === id);
        if (tmp) {
          premises = tmp;
        }
      });
      return premises;
    }
  }

  public static getAnnexFromId(estate: Estate, id: string): Annex {
    if (!estate || estate.localities.length === 0 || !id) {
      return null;
    } else {
      let annex: Annex = null;
      estate.localities.forEach((locality) => {
        const tmp: Annex = locality.annexes.find((a) => a.id === id);
        if (tmp) {
          annex = tmp;
        }
      });
      return annex;
    }
  }

  public static getOwnerName(estate: Estate): string {
    return !estate ? '' : (estate.establishment ? estate.establishment.name : AccountUtils.getName(estate.account));
  }

  public static getOwnerId(estate: Estate): string {
    return !estate ? null : (!estate.establishment ? estate.account.uuid : estate.establishment.uuid);
  }

  public static getOwnerType(estate: Estate): EstateOwnerType {
    return !estate ? null
      : (estate.establishment ? EstateOwnerType.ESTABLISHMENT
        : (estate.account ? (estate.account.entity ? EstateOwnerType.ACCOUNT : EstateOwnerType.INDIVIDUAL) : null));
  }
}

export enum EstateTypeDisplay {
  BUILDING,
  HOUSE,
  DEFAULT,
  UNKNOWN
}

export enum EstateIcon {
  BUILDING = 'location_city',
  HOUSE = 'house',
  DEFAULT = 'domain',
  UNKNOWN = 'foundation'
}

export enum EstateOwnerType {
  ESTABLISHMENT = 'Établissement',
  ACCOUNT = 'Compte',
  INDIVIDUAL = 'Particulier'
}
