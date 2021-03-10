import {People, PeopleWithRole} from "../../services/backend/people.service";
import {AddressUtils} from "./address-utils";

export class PeopleUtils {

  public static emptyPeople: People = {
    addresses: [],
    email: undefined,
    firstname: undefined,
    jobDescription: undefined,
    lastname: undefined,
    mobilePhone: undefined,
    title: undefined,
    uuid: undefined,
    workMail: undefined,
    workPhone: undefined
  };

  public static buildPeople(people?: People): People {
    return people ? {
      addresses: people.addresses ? people.addresses.map(a => AddressUtils.buildAddressWithRole(a.address, a.role)) : [],
      email: people.email,
      firstname: people.firstname,
      jobDescription: people.jobDescription,
      lastname: people.lastname,
      mobilePhone: people.mobilePhone,
      title: people.title,
      uuid: people.uuid,
      workMail: people.workMail,
      workPhone: people.workPhone
    } : this.buildPeople(this.emptyPeople);
  }

  public static buildPeopleWithRole(people?: People, role?: string): PeopleWithRole {
    return {
      people: this.buildPeople(people),
      role: role
    };
  }

  public static duplicate(people: People): People {
    const duplicate: People = this.buildPeople();
    if (people) {
      // Values to duplicate
      duplicate.firstname = people.firstname;
      duplicate.jobDescription = people.jobDescription;
      duplicate.lastname = people.lastname;
      duplicate.title = people.title;
    }
    return duplicate;
  }

  public static getName(people: People): string {
    return people ? people.lastname.toUpperCase() + ' ' + people.firstname + (people.jobDescription ? ' (' + people.jobDescription + ')' : '') : '';
  }

  public static getFullName(people: People): string {
    return people ? people.title + ' ' + people.lastname.toUpperCase() + ' ' + people.firstname : '';
  }
}
