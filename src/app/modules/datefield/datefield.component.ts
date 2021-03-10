import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatDatepicker, MatDatepickerInputEvent} from '@angular/material';
import {DatePipe} from '@angular/common';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-datefield',
  templateUrl: './datefield.component.html',
  styleUrls: ['./datefield.component.scss']
})
export class DatefieldComponent implements OnInit, OnDestroy {

  @ViewChild('picker') picker: MatDatepicker<Date>;

  @Input() inputName: string;
  @Input() initialValue: Date;
  @Input() disabled: boolean;
  @Input() valueChangeInput: Observable<Date>;

  @Output() fieldChange = new EventEmitter<string>();
  @Output() valueChangeOutput = new EventEmitter<number>();

  date: Date;
  dateString: string;
  componentDestroyed: Subject<void> = new Subject();
  inputField: HTMLElement;

  constructor(private datepipe: DatePipe) {
  }

  ngOnInit() {
    if (!!this.initialValue) {
      this.updateDate(this.initialValue);
    }
    if (!!this.valueChangeInput) {
      this.valueChangeInput.pipe(takeUntil(this.componentDestroyed)).subscribe((date) => {
        this.updateDate(date);
      });
    }
    setTimeout(() => this.inputField = document.getElementById('field') as HTMLElement);
  }

  moveCursorToTheEnd(event: any) {
    const inputElement = (event.target as HTMLInputElement);
    inputElement.selectionStart = inputElement.selectionEnd = inputElement.value.length;
  }

  handleDate(event: any) {
    if (event.key === '0' || event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4' || event.key === '5' || event.key === '6' || event.key === '7' || event.key === '8' || event.key === '9') {
      if (!this.dateString) {
        this.dateString = event.key;
      } else {
        if (this.dateString.length < 10) {
          if (this.dateString.length === 1) {
            this.dateString = this.dateString + event.key + '/';
          } else if (this.dateString.length === 2) {
            this.dateString = this.dateString + '/' + event.key;
          } else if (this.dateString.length === 4) {
            this.dateString = this.dateString + event.key + '/';
          } else if (this.dateString.length === 5) {
            this.dateString = this.dateString + '/' + event.key;
          } else {
            this.dateString = this.dateString + event.key;
          }
        }
        if (this.dateString.length === 10) {
          const date = this.dateString.substring(6, 10) + '-' + this.dateString.substring(3, 5) + '-' + this.dateString.substring(0, 2);
          this.date = new Date(date);
          if (isNaN(this.date.getTime())) {
            this.date = null;
            this.valueChangeOutput.emit(null);
          } else {
            if (this.picker.opened) {
              this.picker.close();
              setTimeout(() => this.picker.open(), 50);
              setTimeout(() => this.inputField.click(), 50);
            }
            this.valueChangeOutput.emit(this.date.getTime());
          }
        }
      }
      this.fieldChange.emit(this.dateString);
      event.preventDefault();
    } else if (event.key === 'Backspace') {
      this.date = null;
      if (this.dateString && this.dateString.length > 0) {
        this.dateString = this.dateString.substring(0, this.dateString.length - 1);
        this.fieldChange.emit(this.dateString);
        this.valueChangeOutput.emit(null);
      }
      event.preventDefault();
    } else if (event.key === 'Tab') {
      // allow tab
    } else {
      event.preventDefault();
    }
  }

  setDate(event: MatDatepickerInputEvent<Date>) {
    this.date = event.value;
    this.dateString = this.datepipe.transform(event.value, 'dd/MM/yyyy');
    this.fieldChange.emit(this.dateString);
    this.valueChangeOutput.emit(this.date.getTime());
  }

  updateDate(date: Date) {
    this.date = date;
    if (date) {
      this.dateString = this.datepipe.transform(date, 'dd/MM/yyyy');
    } else {
      this.dateString = '';
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

}
