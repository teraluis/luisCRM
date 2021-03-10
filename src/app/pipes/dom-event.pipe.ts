import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Pipe({
  name: 'domEvent'
})
export class DomEventPipe implements PipeTransform {

  constructor(private  domSanitaizer: DomSanitizer) {}

  transform(value: any, args?: any): SafeHtml {
    return this.domSanitaizer.bypassSecurityTrustHtml(value);
  }

}
