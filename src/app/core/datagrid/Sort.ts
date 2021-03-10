import {SortDirection} from '@angular/material/sort/typings/sort-direction';

export class Sort {
  field: string;
  type: 'text' | 'other';
  direction: SortDirection;
}
