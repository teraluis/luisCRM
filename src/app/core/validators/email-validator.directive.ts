import {Directive} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validateEmail(): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }
    const EMAIL_REGEXP = /^[\w\d!#$%&'*+\/=?^_`{|}~.-]+@[\w\d._-]+\.[\w.]{2,4}$/i;

    return !c.value || EMAIL_REGEXP.test(c.value) ? null : {validEmail: false};
  };
}

@Directive({
  selector: '[appValidateEmail][ngModel], [appValidateEmail][formControlName]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: EmailValidatorDirective, multi: true}
  ]
})
export class EmailValidatorDirective {

  validate(c: FormControl) {
    return validateEmail()(c);
  }
}
