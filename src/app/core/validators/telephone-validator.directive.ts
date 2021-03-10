import {Directive} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validatePhoneNumber(): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }
    const TEL_REGEXP = /^((\+\d{1,3}([- ])?\(?\d\)?([- ])?\d{1,5})|(\(?\d{2,6}\)?))([- ])?(\d{3,4})([- ])?(\d{4})(( x| ext)\d{1,5})?$/i;

    return TEL_REGEXP.test(c.value) ? null : {validTel: false};
  };
}

@Directive({
  selector: '[appValidateTelephone][ngModel], [appValidateTelephone][formControlName]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: TelephoneValidatorDirective, multi: true}
  ]
})
export class TelephoneValidatorDirective {

  validate(c: FormControl) {
    return validatePhoneNumber()(c);
  }
}
