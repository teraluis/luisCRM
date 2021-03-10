import {Component, DoCheck, Input, IterableDiffer, IterableDiffers} from '@angular/core';

@Component({
  selector: 'app-plus-button',
  templateUrl: './plus-button.component.html',
  styleUrls: ['./plus-button.component.scss']
})
export class PlusButtonComponent implements DoCheck {

  @Input() data: PlusActionData[];

  _data: PlusActionData[];

  action = false;
  private iterableDiffer: IterableDiffer<PlusActionData>;

  constructor(private iterableDiffers: IterableDiffers) {
    this.iterableDiffer = iterableDiffers.find([]).create(null);
  }

  ngDoCheck(): void {
    const changes = this.iterableDiffer.diff(this.data);
    if (changes) {
      this._data = this.data.map(value => {
        const disableFn: () => boolean = !!value.disabledFn ? value.disabledFn : () => !!value.disabled;
        return {
          function: value.function,
          label: value.label,
          icon: value.icon,
          disabledFn: disableFn,
          hidden: value.hidden,
        };
      });
    }
  }

  titleCaseWord(word: string) {
    if (!word) { return word; }
    return word[0].toUpperCase() + word.substr(1).toLowerCase();
  }
}

export interface PlusActionData {
  function: (...args: any) => any; // callback
  label: string;
  icon?: string;
  disabled?: boolean; // will be overridden by disabledFn() if defined
  disabledFn?(): boolean; // will override disabled value if defined
  hidden?: boolean;
}
