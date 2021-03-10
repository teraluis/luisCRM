import {Directive, Input} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export function validateSiret(siren: string): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }

    let digits: number[];
    if (siren) {
      digits = (siren + c.value).split('').map(digit => parseInt(digit, 10)).reverse();
    } else {
      digits = c.value.split('').map(digit => parseInt(digit, 10)).reverse();
    }

    if (digits.length !== 14) {
      return {validSiret: false};
    } else if (c.value.startsWith('356000000') && isAllValuesAreNumber(digits)) {  // Poste specific calculation
      const total = digits.reduce((acc, curr) => acc + curr, 0);
      return !(total % 5) ? null : {validSiret: false};
    } else if (isAllValuesAreNumber(digits)) {
      const total = digits
        .map((digit, index) => index % 2 ? digit * 2 : digit)
        .map(digit => digit > 9 ? reduceNumber(digit) : digit)
        .reduce((acc, curr) => acc + curr, 0);
      return !(total % 10) ? null : {validSiret: false};
    } else {
      return {validSiret: false};
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
  selector: '[appValidateSIRET][ngModel], [appValidateSIRET][formControl]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: SiretValidatorDirective, multi: true}
  ]
})
export class SiretValidatorDirective implements Validator {
  @Input() siren: string;

  validate(c: FormControl) {
    return validateSiret(this.siren)(c);
  }
}
