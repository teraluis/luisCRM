import {Address, AddressType, AddressWithRole} from "../../services/backend/addresses.service";

export class AddressUtils {

  public static emptyAddress: Address = {
    address1: undefined,
    address2: undefined,
    city: undefined,
    country: 'FR',
    created: undefined,
    dispatch: undefined,
    gpsCoordinates: undefined,
    inseeCoordinates: undefined,
    postCode: undefined,
    staircase: undefined,
    type: AddressType.PHYSICAL,
    uuid: undefined,
    wayType: undefined
  };

  public static buildAddress(address?: Address): Address {
    return address ? {
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      country: address.country,
      created: address.created,
      dispatch: address.dispatch,
      gpsCoordinates: address.gpsCoordinates,
      inseeCoordinates: address.inseeCoordinates,
      postCode: address.postCode,
      staircase: address.staircase,
      type: address.type,
      uuid: address.uuid,
      wayType: address.wayType
    } : this.buildAddress(this.emptyAddress);
  }

  public static buildAddressWithRole(address?: Address, role?: string): AddressWithRole {
    return {
      address: this.buildAddress(address),
      role: role
    };
  }

  public static duplicate(address: Address): Address {
    const duplicate: Address = this.buildAddress();
    if (address) {
      // Values to duplicate
      duplicate.address1 = address.address1;
      duplicate.city = address.city;
      duplicate.country = address.country;
      duplicate.dispatch = address.dispatch;
      duplicate.gpsCoordinates = address.gpsCoordinates;
      duplicate.inseeCoordinates = address.inseeCoordinates;
      duplicate.postCode = address.postCode;
      duplicate.staircase = address.staircase;
      duplicate.type = address.type;
      duplicate.wayType = address.wayType;
    }
    return duplicate;
  }

  public static clone(address: Address): Address {
    const clone: Address = this.buildAddress(address);
    clone.uuid = undefined;
    return clone;
  }

  public static getFullName(address: Address): string {
    return !address ? '' :
      (address.address1 && address.postCode && address.city ? address.address1 + (address.address2 ? ', ' + address.address2 : '') + ', ' + address.postCode + ' ' + address.city
        : (address.gpsCoordinates ? 'GPS: ' + address.gpsCoordinates
          : (address.inseeCoordinates ? 'INSEE: ' + address.inseeCoordinates : '')));
  }

  public static getName(address: Address): string {
    return !address ? '' :
      (address.address1 ? address.address1 + (address.address2 ? ', ' + address.address2 : '')
        : (address.gpsCoordinates ? 'GPS: ' + address.gpsCoordinates
          : (address.inseeCoordinates ? 'INSEE: ' + address.inseeCoordinates : '')));
  }

  public static getLocality(address: Address): string {
    return !address ? '' :
      (address.postCode && address.city ? address.postCode + ' ' + address.city
        : (address.gpsCoordinates ? 'GPS: ' + address.gpsCoordinates
          : (address.inseeCoordinates ? 'INSEE: ' + address.inseeCoordinates : '')));
  }
}
