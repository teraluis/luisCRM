import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {ValidationErrors} from '@angular/forms';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-form-errors-handler',
  templateUrl: './form-errors-handler.component.html',
  styleUrls: ['./form-errors-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormErrorsHandlerComponent implements OnInit {
  @Input() errors: ValidationErrors;

  translateService;

  constructor(translate: TranslateService) {
    this.translateService = translate;
  }

  ngOnInit() {
  }

  handleErrors() {
    return "Le champ " + this.translateService.instant(this.errors[this.errors.length - 1].labelError)  + " est " + this.translateService.instant(this.errors[this.errors.length - 1].typeError);
  }

}
