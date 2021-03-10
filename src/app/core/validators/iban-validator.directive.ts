import {Directive, forwardRef} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validateIban(): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }

    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let iban = c.value.replace(/[- ]/g, '');
    const start = iban.slice(0, 4);
    iban = iban.slice(4, iban.length);
    iban += start;
    iban = iban
      .split('')
      .map(char => isNaN(char) ? (alpha.indexOf(char) + 10).toString(10) : char)
      .join('');

    let total = '';

    // Calculate by slice of 10 numbers cause JS can't handle higher number
    for (let i = 0; i < iban.length; i = i + 10) {
      total = (parseInt((total || '') + iban.slice(i, i + 10), 10) % 97).toString(10);
    }

    return total === '1' ? null : {validIban: false};
  };
}

@Directive({
  selector: '[appValidateRIB][ngModel], [appValidateRIB][formControlName]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => IbanValidatorDirective), multi: true}
  ]
})
export class IbanValidatorDirective {

  validate(c: FormControl) {
    return validateIban()(c);
  }
}
