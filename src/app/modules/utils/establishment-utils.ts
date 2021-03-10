import {Establishment, EstablishmentWithRole} from "../../services/backend/establishments.service";

export class EstablishmentUtils {

  public static emptyEstablishment: Establishment = {
    activity: undefined,
    corporateName: undefined,
    created: undefined,
    description: undefined,
    entity: undefined,
    mail: undefined,
    name: undefined,
    phone: undefined,
    siret: undefined,
    uuid: undefined,
    iban: undefined,
    bic: undefined,
    facturationAnalysis: undefined,
    agency: undefined
  };

  public static buildEstablishment(establishment?: Establishment): Establishment {
    return establishment ? {
      activity: establishment.activity,
      corporateName: establishment.corporateName,
      created: establishment.created,
      description: establishment.description,
      entity: establishment.entity,
      mail: establishment.mail,
      name: establishment.name,
      phone: establishment.phone,
      siret: establishment.siret,
      uuid: establishment.uuid,
      iban: establishment.iban,
      bic: establishment.bic,
      facturationAnalysis: establishment.facturationAnalysis,
      agency: establishment.agency
    } : this.buildEstablishment(this.emptyEstablishment);
  }

  public static buildEstablishmentWithRole(establishment?: Establishment, role?: string): EstablishmentWithRole {
    return {
      establishment: this.buildEstablishment(establishment),
      role: role
    };
  }

  public static duplicate(establishment: Establishment): Establishment {
    const duplicate: Establishment = this.buildEstablishment();
    if (establishment) {
      // Values to duplicate
      duplicate.activity = establishment.activity;
      duplicate.corporateName = establishment.corporateName;
      duplicate.description = establishment.description;
      duplicate.entity = establishment.entity;
      duplicate.mail = establishment.mail;
      duplicate.phone = establishment.phone;
      duplicate.iban = establishment.iban;
      duplicate.bic = establishment.bic;
      duplicate.facturationAnalysis = establishment.facturationAnalysis;
      duplicate.agency = establishment.agency;
    }
    return duplicate;
  }
}
