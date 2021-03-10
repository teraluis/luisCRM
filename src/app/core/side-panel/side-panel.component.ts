import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {CustomDatasource} from '../datagrid';
import {PageEvent} from '@angular/material';
import {SidePanelContent} from './model/side-panel-content';
import {Sort} from '../datagrid/Sort';

@Component({
  selector: 'app-side-panel-new',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss']
})
export class SidePanelComponent implements AfterViewInit, OnDestroy {
  @Input() content: SidePanelContent;
  @Input() canNavigate = false;
  @Input() dataSource: CustomDatasource<any>;
  @Input() filter: any = {};
  @Input() page: PageEvent;
  @Input() sort: Sort;

  @Output() setContent: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('sidePanel') sidePanel: MatSidenav;

  private index: number;

  isLoading = true;

  ngAfterViewInit(): void {
    this.dataSource.connect(null).subscribe(res => {
      setTimeout(() => this.isLoading = false);
      if (res.length) {
        this.setContent.emit(res[0]);
      }
    });
    this.dataSource.resultCount.subscribe(res => {
      if (!this.page) {
        this.page = {
          length: 1,
          pageSize: 1,
          pageIndex: 0
        };
      }
      this.page.length = res;
    });
    this.sidePanel.openedStart.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.dataSource.disconnect(null);
  }

  loadData() {
    this.isLoading = true;
    this.dataSource.load(
      this.filter,
      this.sort,
      this.page.pageIndex * this.page.pageSize + this.index,
      1);

  }

  toggle(index: number) {
    this.index = index;
    this.sidePanel.toggle();
  }

  previous() {
    if (!this.hasPrevious()) {
      return;
    }
    this.index = this.index - 1;
    this.loadData();
  }

  next() {
    if (!this.hasNext()) {
      return;
    }
    this.index = this.index + 1;
    this.loadData();
  }

  hasPrevious() {
    return (this.page.pageIndex * this.page.pageSize + (this.index - 1)) >= 0;
  }

  hasNext() {
    return (this.page.pageIndex * this.page.pageSize + (this.index + 1)) < this.page.length;
  }

  getPagination() {
    return this.page && this.index > -1 ? `${this.page.pageIndex * this.page.pageSize + this.index + 1}/${this.page.length}` : '0/0';
  }
}
