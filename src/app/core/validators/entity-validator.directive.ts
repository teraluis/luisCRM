import {FormControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function entityValidator(o: any): ValidatorFn {
  return (c: FormControl): ValidationErrors | null => {
    if (!c.value) {
      return null;
    }

    return c.value instanceof o ? null : {validEntity: false};
  };
}
