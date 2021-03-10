import {NgModule} from '@angular/core';
import {SidePanelComponent} from './side-panel.component';
import {CommonModule} from '@angular/common';
import {MatDividerModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, MatSidenavModule, MatToolbarModule} from '@angular/material';
import {RouterModule} from "@angular/router";

@NgModule({
    imports: [
        CommonModule,
        MatSidenavModule,
        MatToolbarModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatPaginatorModule,
        RouterModule
    ],
  exports: [
    SidePanelComponent
  ],
  declarations: [
    SidePanelComponent
  ]
})
export class SidePanelModule {
}
