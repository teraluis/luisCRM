import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortable} from '@angular/material/sort';
import {merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, tap} from 'rxjs/operators';
import {FormBuilder, FormGroup} from '@angular/forms';
import {FilterType} from './model/filter-type.enum';
import {Action} from './model/action';
import {ColumnInfo} from './model/column-info';
import {ActionType} from './model/action.type.enum';
import {GlobalAction} from './model/global-action';
import {GlobalActionType} from './model/global-action-type.enum';
import {CustomDatasource} from './custom.datasource';
import {ActionCustom} from './model/action-custom';
import {OverlayRef} from '@angular/cdk/overlay';
import {saveAs} from 'file-saver';
import {PageEvent} from '@angular/material/paginator/typings/paginator';
import {Sort} from './Sort';

@Component({
  selector: 'app-datagrid',
  templateUrl: './datagrid.component.html',
  styleUrls: ['./datagrid.component.scss']
})
export class DatagridComponent implements OnInit, AfterViewInit {
  total = 0;
  filterType = FilterType;
  form: FormGroup;
  actionType = ActionType;
  globalActionType = GlobalActionType;
  hiddenColumn: string[] = [];
  allLineSelected = false;
  selectedLines: any[] = [];
  isOpen = false;
  globalActionSelectValue;
  isLoading = false;

  private fieldSort: Sort;

  @Input() columnInfo: ColumnInfo[] = [];
  @Input() dataSource: CustomDatasource<any>;
  @Input() action: Action[] | ActionCustom[] = [];
  @Input() globalAction: GlobalAction[] = [];
  @Input() canSelect: boolean;
  @Input() dataGridId: string;
  @Input() canExportAndImportFilter: boolean;

  @Output() filterChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() pageChanged: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() sortChanged: EventEmitter<Sort> = new EventEmitter<Sort>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('popover') popover: OverlayRef;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.form = this.fb.group(this.columnInfo.reduce((acc, cur: ColumnInfo) => {
      acc[cur.name] = [null];
      return acc;
    }, {}));
    this.form.addControl('deactivate', this.fb.control(null));

    if (this.canBeBookmarked()) {
      this.form.addControl('bookmark', this.fb.control(null));
    }

    this.dataSource.resultCount.subscribe(() => this.isLoading = false);

    if (!this.dataGridId) {
      throw new Error('Input dataGridId required');
    }
  }

  ngAfterViewInit(): void {
    this.restoreFilters();
    this.dataSource.resultCount.subscribe(res => this.total = res);

    merge(
      this.sort.sortChange.pipe(tap(() => this.paginator.pageIndex = 0)),
      this.paginator.page,
      this.form.valueChanges
    )
      .pipe(
        distinctUntilChanged(),
        tap(() => this.isLoading = true),
        debounceTime(500),
        tap(() => this.loadPage())
      )
      .subscribe();
  }

  selectAll(evt): void {
    this.allLineSelected = evt.checked;
    this.selectedLines = [];
  }

  selectLine(evt, element: any): void {
    if (this.selectedLines.includes(element)) {
      this.selectedLines = this.selectedLines.filter(e => e !== element);
    } else {
      this.selectedLines.push(element);
    }
  }

  getDisplayedColumn(): string[] {
    const cols = [];
    if (this.canSelect) {
      cols.push('option_start');
    }
    cols.push(...this.columnInfo.map(e => e.name).filter(e => !this.hiddenColumn.includes(e)));
    cols.push('action_end');
    return cols;
  }

  changeColumnVisibility(evt: any, column: string): void {
    evt.stopPropagation();
    if (this.hiddenColumn.includes(column)) {
      this.hiddenColumn = this.hiddenColumn.filter(e => e !== column);
    } else {
      this.hiddenColumn.push(column);
    }
    this.saveFilters();
  }

  hasAction(type: ActionType): boolean {
    return (this.action as Action[]).map(e => e.type).includes(type);
  }

  getAction(type: ActionType): Action {
    return this.action.find(e => e.type === type);
  }

  getAllCustomAction(): ActionCustom[] {
    return (this.action.filter(e => e.type === ActionType.CUSTOM) as ActionCustom[]);
  }

  getCustomAction(id: any): ActionCustom {
    return this.getAllCustomAction().find(e => e.id === id);
  }

  hasTooManyActionAndSomeNotForced(): boolean {
    return this.action.length > 2 && !!this.action.filter(e => !e.force).length;
  }

  hasTooManyActionAndNotForced(type: ActionType): boolean {
    return this.action.length > 2 && !this.action.find(e => e.type === type).force;
  }

  hasTooManyActionAndNotForcedCustom(id: string): boolean {
    return this.action.length > 2 && !this.getCustomAction(id).force;
  }

  isDisabled(type: ActionType, element: any): boolean {
    return this.getAction(type).disable && this.getAction(type).disable(element);
  }

  isDisabledCustom(id: any, element: any): boolean {
    return this.getCustomAction(id).disable && this.getCustomAction(id).disable(element);
  }

  isVisibleCustom(id: any, element: any): boolean {
    return this.getCustomAction(id).show && this.getCustomAction(id).show(element) || !this.getCustomAction(id).show;
  }

  canBeDeactivate(): boolean {
    return !!this.action.find(e => e.type === ActionType.ACTIVATE || e.type === ActionType.DEACTIVATE)
      || !!this.globalAction.find(e => e.type === GlobalActionType.ACTIVATE || e.type === GlobalActionType.DEACTIVATE);
  }

  selectAction(evt): void {
    const type = evt.type || evt.value.type;
    console.log(evt);
    if ('Exporter' === type && !this.globalAction.find(e => e.type === type).action) {
      const replacer = (key, value) => value === null ? '' : value;
      const header = this.columnInfo.map(e => e.name);
      let csv;
      if (!this.allLineSelected && this.selectedLines.length) {
        csv = this.selectedLines.map(row => header.map(fieldName => JSON.stringify(this.getObjectValueFromPath(fieldName, row), replacer)).join(','));
        this.saveCsvFile(header, csv);
        this.globalActionSelectValue = null;
      } else if (this.canSelect && this.allLineSelected || !this.canSelect) {
        this.dataSource.service.get(this.form.getRawValue(), this.fieldSort, 0, 2000)
          .subscribe(res => {
            csv = res.data.map(row => header.map(fieldName => JSON.stringify(this.getObjectValueFromPath(fieldName, row), replacer)).join(','));
            this.saveCsvFile(header, csv);
            this.globalActionSelectValue = null;
          });
      }
    } else {
      this.globalAction.find(e => e.type === type).action(this.selectedLines, this.allLineSelected);
    }
  }

  isGlobalActionSelectInputDisable(): boolean {
    const hasExportType = this.globalAction.filter(ga => ga.type === GlobalActionType.EXPORT);
    return !(!!this.globalAction.length && (!!this.selectedLines.length || this.allLineSelected)) && !hasExportType.length;
  }

  isGlobalActionOptionDisable(): boolean {
    const hasExportType = this.globalAction.filter(ga => ga.type === GlobalActionType.EXPORT);
    return !((!!this.selectedLines.length || this.allLineSelected) ||
      (this.canSelect && (this.selectedLines.length || this.allLineSelected) && !!hasExportType.length) ||
      (!this.canSelect && !!hasExportType.length));
  }

  getContext(action, element): any {
    return JSON.parse(JSON.stringify({action, element}));
  }

  executeAction(type: ActionType, element: any): void {
    if (!this.getAction(type).disable || this.getAction(type).disable(element)) {
      this.getAction(type).click(element);
    }
  }

  executeCustomAction(id: string, element: any): void {
    if (!this.isDisabledCustom(id, element)) {
      this.getCustomAction(id).click(element);
    }
  }

  closePopover(): void {
    this.isOpen = false;
  }

  getKeys(header: ColumnInfo): string[] {
    return Object.keys(header.enumString);
  }

  resetFilter(): void {
    this.form.reset();
    this.sort.sort({id: '', start: 'asc', disableClear: false});
  }

  getObjectValueFromPath(path, obj): string {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj || self);
  }

  buildRouterLink(header, obj): string[] {
    const parts = header.routerLink(obj).split('/');
    const link = ['/'];
    parts.forEach(part => {
      if (part.startsWith(':')) {
        link.push(this.getObjectValueFromPath(part.substr(1, part.length), obj));
      } else {
        link.push(part);
      }
    });
    return link;
  }

  canBeBookmarked(): boolean {
    return !!this.columnInfo.filter(c => c.filterType === FilterType.BOOKMARK).length;
  }

  notOnlyResetButton(): boolean {
    return this.canBeBookmarked() || this.canBeDeactivate();
  }

  loadPage(): void {
    const type = this.columnInfo.find(c => c.name === this.sort.active);
    const sort: Sort = {
      field: this.sort.active,
      type: type && (
        type.filterType === FilterType.TEXT ||
        type.filterType === FilterType.STATUS ||
        type.filterType === FilterType.SELECT
      ) ? 'text' : 'other',
      direction: this.sort.direction
    };

    this.fieldSort = sort;

    this.saveFilters();

    this.filterChanged.emit(this.form.getRawValue());
    this.pageChanged.emit(this.paginator);
    this.sortChanged.emit(this.fieldSort);
    this.dataSource.load(
      this.form.getRawValue(),
      sort,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  exportFilter(): void {
    const data = localStorage.getItem(this.dataGridId);
    const blob = new Blob([data], {type: 'application/json'});
    saveAs(blob, `export_filtre_${this.dataGridId}.json`);
  }

  onImportFilterInputChange(evt: Event) {
    const reader = new FileReader();
    reader.onload = () => {
      this.restoreFilters(reader.result.toString());
    };
    let file: File;
    const eventObj: MSInputMethodContext = evt as unknown as MSInputMethodContext;
    const target: HTMLInputElement = eventObj.target as HTMLInputElement;
    const files: FileList = target.files;
    file = files[0];
    reader.readAsText(file);
  }

  showGlobalAction(): boolean {
    const hasExportType = this.globalAction.filter(ga => ga.type === GlobalActionType.EXPORT);
    return this.canSelect || !!hasExportType.length;
  }

  getLongLabelOfGlobalAction(type) {
    switch (type) {
      case GlobalActionType.EXPORT:
        return 'Exporter les données';
      case GlobalActionType.ACTIVATE:
        return 'Activer les lignes sélectionnées';
      case GlobalActionType.DEACTIVATE:
        return 'Désactiver les lignes sélectionnées';
      case GlobalActionType.DELETE:
        return 'Supprimer les lignes sélectionnées';
      default:
        return type;
    }
  }

  private saveCsvFile(header, content): void {
    content.unshift(header.join(';'));
    const csvArray = content.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv'});
    saveAs(blob, 'export.csv');
  }

  private saveFilters(): void {
    const data: any = {
      paginator: {
        index: this.paginator.pageIndex,
        size: this.paginator.pageSize
      },
      filter: this.form.getRawValue(),
      hiddenColumn: this.hiddenColumn
    };
    if (this.fieldSort && this.fieldSort.field) {
      data.sort = this.fieldSort;
    }
    const filters = JSON.stringify(data);
    localStorage.setItem(this.dataGridId, filters);
  }

  private restoreFilters(dataAsString: string = null): void {
    const data = dataAsString || localStorage.getItem(this.dataGridId);
    if (data) {
      const parsedData = JSON.parse(data);
      setTimeout(() => {
        this.resetFilter();
        this.paginator.pageIndex = parsedData.paginator.index;
        this.paginator.pageSize = parsedData.paginator.size;
        if (parsedData.hiddenColumn) {
          this.hiddenColumn = parsedData.hiddenColumn;
        }

        if (parsedData.sort) {
          const sortValue: MatSortable = {
            id: parsedData.sort.field,
            start: parsedData.sort.direction,
            disableClear: false
          };
          this.sort.sort(sortValue);
          const sortHeader = this.sort.sortables.get(parsedData.sort.field);
          sortHeader['_setAnimationTransitionState']({toState: 'active'});
        }
        this.form.patchValue(parsedData.filter);
      });
    } else {
      this.loadPage();
    }
  }
}
