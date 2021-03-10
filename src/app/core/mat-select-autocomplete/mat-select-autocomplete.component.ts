import {Component, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatFormFieldAppearance} from '@angular/material/form-field';

@Component({
  selector: 'app-mat-select-autocomplete',
  templateUrl: './mat-select-autocomplete.component.html',
  styleUrls: ['./mat-select-autocomplete.component.scss']
})
export class MatSelectAutocompleteComponent implements OnChanges {
  @Input() placeholder;
  @Input() options;
  @Input() disabled = false;
  @Input() display = 'display';
  @Input() value = 'value';
  @Input() formControl = new FormControl();
  @Input() errorMsg = 'Field is required';
  @Input() showErrorMsg = false;
  @Input() selectedOptions;
  @Input() multiple = true;

  // New Options
  @Input() labelCount = 1;
  @Input() appearance: MatFormFieldAppearance = 'standard';
  @Input() searchPlaceholder = 'Search...';

  @Output() selectionChange: EventEmitter<any> = new EventEmitter();

  @ViewChild('selectElem') selectElem;

  filteredOptions: Array<any> = [];
  selectedValue: Array<any> = [];
  selectAllChecked = false;
  displayString = '';

  constructor() {
  }

  ngOnChanges(): void {
    this.filteredOptions = this.options;
    if (this.selectedOptions) {
      this.selectedValue = this.selectedOptions;
    } else if (this.formControl.value) {
      this.selectedValue = this.formControl.value;
    }
  }

  toggleDropdown(): void {
    this.selectElem.toggle();
  }

  toggleSelectAll(val) {
    if (val.checked) {
      this.filteredOptions.forEach(option => {
        if (!this.selectedValue.includes(option[this.value])) {
          this.selectedValue = this.selectedValue.concat([option[this.value]]);
        }
      });
    } else {
      const filteredValues = this.getFilteredOptionsValues();
      this.selectedValue = this.selectedValue.filter(
        item => !filteredValues.includes(item)
      );
    }
    this.selectionChange.emit(this.selectedValue);
  }

  filterItem(value): void {
    this.filteredOptions = this.options.filter(
      item => item[this.display].toLowerCase().indexOf(value.toLowerCase()) > -1
    );
    this.selectAllChecked = true;
    this.filteredOptions.forEach(item => {
      if (!this.selectedValue.includes(item[this.value])) {
        this.selectAllChecked = false;
      }
    });
  }

  hideOption(option): boolean {
    return !(this.filteredOptions.indexOf(option) > -1);
  }

  // Returns plain strings array of filtered values
  getFilteredOptionsValues(): any[] {
    const filteredValues = [];
    this.filteredOptions.forEach(option => {
      filteredValues.push(option.value);
    });
    return filteredValues;
  }

  onDisplayString(): string {
    this.displayString = '';
    if (this.selectedValue && this.selectedValue.length) {
      if (this.multiple) {

        this.displayString = this.selectedValue
          .map(s => this.options.find(o => o[this.value] === s)[this.display])
          .slice(0, this.labelCount)
          .join(',');

        if (this.selectedValue.length > this.labelCount) {
          this.displayString += ` (+${this.selectedValue.length - this.labelCount})`;
        }
      } else {
        // Single select display
        const displayOption = this.options.find(
          option => option[this.value] === this.selectedValue
        );
        if (displayOption) {
          this.displayString = displayOption[this.display];
        }
      }
    }
    return this.displayString;
  }

  onSelectionChange(val): void {
    const filteredValues = this.getFilteredOptionsValues();
    let count = 0;
    if (this.multiple) {
      this.selectedValue.filter(item => {
        if (filteredValues.includes(item)) {
          count++;
        }
      });
      this.selectAllChecked = count === this.filteredOptions.length;
    }
    this.selectedValue = val.value;
    this.selectionChange.emit(this.selectedValue);
  }

}
