import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatagridComponent} from './datagrid.component';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorIntl, MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule} from '@angular/material/dialog';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {OverlayModule} from '@angular/cdk/overlay';
import {RouterModule} from '@angular/router';
import {CustomPaginator} from "./CustomPaginatorConfiguration";
import {NGX_MAT_DATE_FORMATS, NgxMatDateFormats, NgxMatDatetimePickerModule} from '@angular-material-components/datetime-picker';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {NgxMatMomentModule} from '@angular-material-components/moment-adapter';

import * as moment from 'moment';
import 'moment/locale/fr';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {DateAdapter, MAT_DATE_FORMATS, SatDatepickerModule} from 'saturn-datepicker';

import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';

moment.locale('fr');

const CUSTOM_DATE_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: 'X'
  },
  display: {
    dateInput: 'l',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@NgModule({
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatIconModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatMenuModule,
        MatDialogModule,
        DragDropModule,
        MatCheckboxModule,
        MatButtonModule,
        MatSlideToggleModule,
        OverlayModule,
        RouterModule,
        NgxMatDatetimePickerModule,
        MatDatepickerModule,
        NgxMatMomentModule,
        SatDatepickerModule,
        MatProgressSpinnerModule,
        MatTooltipModule

    ],
  exports: [
    DatagridComponent
  ],
  declarations: [
    DatagridComponent
  ],
  providers: [
    {provide: MatPaginatorIntl, useValue: CustomPaginator()},
    {provide: MAT_DATE_LOCALE, useValue: 'fr-FR'},
    {provide: NGX_MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS}
  ]
})
export class DatagridModule {
}
