import {Account, AccountStatus, AccountWithRole} from "../../services/backend/accounts.service";
import {Entity} from "../../services/backend/entities.service";
import {PeopleUtils} from "./people-utils";

export class AccountUtils {

  public static emptyAccount: Account = {
    category: undefined,
    commercial: undefined,
    contact: undefined,
    created: undefined,
    entity: undefined,
    groups: [],
    importance: undefined,
    maxPaymentTime: undefined,
    reference: undefined,
    state: undefined,
    type: undefined,
    uuid: undefined
  };

  public static emptyEntity: Entity = {
    corporateName: undefined,
    created: undefined,
    description: undefined,
    domain: undefined,
    logo: undefined,
    mainAddress: undefined,
    name: undefined,
    siren: undefined,
    type: undefined,
    uuid: undefined
  };

  public static buildAccount(account?: Account): Account {
    return account ? {
      category: account.category,
      commercial: account.commercial,
      contact: PeopleUtils.buildPeople(account.contact),
      created: account.created,
      entity: account.entity ? this.buildEntity(account.entity) : undefined,
      groups: account.groups ? account.groups : [],
      importance: account.importance,
      maxPaymentTime: account.maxPaymentTime,
      reference: account.reference,
      state: account.state,
      type: account.type,
      uuid: account.uuid
    } : this.buildAccount(this.emptyAccount);
  }

  public static buildEntity(entity?: Entity): Entity {
    return entity ? {
      corporateName: entity.corporateName,
      created: entity.created,
      description: entity.description,
      domain: entity.domain,
      logo: entity.logo,
      mainAddress: entity.mainAddress,
      name: entity.name,
      siren: entity.siren,
      type: entity.type,
      uuid: entity.uuid
    } : this.buildEntity(this.emptyEntity);
  }

  public static buildAccountWithRole(account?: Account, role?: string): AccountWithRole {
    return {
      account:  this.buildAccount(account),
      role: role
    };
  }

  public static duplicate(account: Account): Account {
    const duplicate: Account = this.buildAccount();
    if (account) {
      // Values to duplicate
      duplicate.category = account.category;
      duplicate.commercial = account.commercial;
      duplicate.groups = account.groups ? account.groups : [];
      duplicate.importance = account.importance;
      duplicate.maxPaymentTime = account.maxPaymentTime;
      duplicate.type = account.type;
    }
    return duplicate;
  }

  public static duplicateEntity(entity: Entity): Entity {
    const duplicate: Entity = this.buildEntity();
    if (entity) {
      // Values to duplicate
      duplicate.corporateName = entity.corporateName;
      duplicate.description = entity.description;
      duplicate.domain = entity.domain;
      duplicate.type = entity.type;
    }
    return duplicate;
  }

  public static getName(account: Account): string {
    return account ? (account.entity ? account.entity.name : PeopleUtils.getName(account.contact)) : '';
  }

  public static getStatusName(status: number | string): string {
    switch (Number(status)) {
      case AccountStatus.VALID:
        return 'Compte validé';
      case AccountStatus.INVALID:
        return 'Compte non validé';
      case AccountStatus.INACTIVE:
        return 'Compte désactivé';
      default:
        return 'État inconnu';
    }
  }

  public static getStatusColor(status: number | string): string {
    switch (Number(status)) {
      case AccountStatus.VALID:
        return 'green';
      case AccountStatus.INACTIVE:
        return 'red';
      case AccountStatus.INVALID:
        return 'warn';
      default:
        return 'grey';
    }
  }
}
