import {Directive} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validateSiren(): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }
    const digits: number[] = c.value.split('').map(digit => parseInt(digit, 10)).reverse();
    if (isAllValuesAreNumber(digits)) {
      const total = digits
        .map((digit, index) => index % 2 ? digit * 2 : digit)
        .map(digit => digit > 9 ? reduceNumber(digit) : digit)
        .reduce((acc, curr) => acc + curr, 0);
      return !(total % 10) ? null : {validSiren: false};
    } else {
      return {validSiren: false};
    }
  };
}

function isAllValuesAreNumber(digits) {
  return digits.reduce((acc, digit) => acc && !Number.isNaN(digit), true);
}

function reduceNumber(values: number) {
  return values
    .toString(10)
    .split('')
    .reduce((acc, curr) => acc + parseInt(curr, 10), 0);
}

@Directive({
  selector: '[appValidateSIREN][ngModel], [appValidateSIREN][formControl]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: SirenValidatorDirective, multi: true}
  ]
})
export class SirenValidatorDirective {

  validate(c: FormControl) {
    return validateSiren()(c);
  }
}
