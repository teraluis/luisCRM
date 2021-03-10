import {Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {MarketsService} from '../../services/backend/markets.service';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {SelectionModel} from '@angular/cdk/collections';
import {SidePanelService, SidePanelType} from '../../services/front/sidepanel.service';
import {debounceTime} from 'rxjs/operators';
import {Sort} from '@angular/material/sort';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {AccountsService} from '../../services/backend/accounts.service';
import {MatPaginator} from '@angular/material/paginator';
import {AccountUtils} from "../utils/account-utils";

/**
 * Interface to be implemented to use the following component :
 * <app-table-search-list [dataSourceChange]="dataSourceChange" [displayedColumns]="displayedColumns" [hiddenColumns]="hiddenColumns" [columnsInfos]="columnsInfos"
 *                        [maxRows]="maxRows" [options]="options" [loadEmitter]="isLoading"
 *                        (pageData)="setPageData($event)" (filterData)="setFilterData($event)"></app-table-search-list>
 * <!-- Optional: (clickEvent)="clickEvent($event)" [router]="getRouterLink" [sidePanelType]="sidePanelType" [statusList]="getStatusList" [statusName]="getStatusName" [statusColor]="getStatusColor" [comboList]="getComboList" -->
 */
export interface TableSearchListInterface {
  /**
   * Define the boolean to know is the page is loading or not.
   */
  isLoading: EventEmitter<boolean>;
  /**
   * Define the options of the data grid.
   * See TableOption for more details.
   */
  options: TableOption[];
  /**
   * List of the columns displayed by default.
   * Columns names must match the attributes of the TableLine interface.
   */
  displayedColumns: string[];
  /**
   * List of the columns hidden by default.
   * Columns names must match the attributes of the TableLine interface.
   */
  hiddenColumns: string[];
  /**
   * Define the information for all displayedColumns and hiddenColumns.
   * Interface is defined by ColumnInformation.
   * Names must match those of displayedColumns and hiddenColumns.
   */
  columnsInfos: ColumnInformation[];
  /**
   * Define the number of rows displayed in the data grid for the setPageData
   */
  maxRows: number;
  /**
   * Define the row type to be displayed in the side panel.
   * To be defined only if TableOption.PREVIEW is present.
   * New types must be implemented in the SidePanelService.
   */
  sidePanelType?: SidePanelType;
  /**
   * EventEmitter to pass the datasource and the filter to the component.
   * To be used in setPageData as follow :
   *   this.dataSourceChange.emit({dataSource: dataSource, filter: null});
   * To be used in  setFilterData as follow :
   *   this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
   */
  dataSourceChange: EventEmitter<{ dataSource: MatTableDataSource<TableLine>, filter?: string }>;

  /**
   * Set datasource with a getPage to optimize the number of results.
   * See comment of : dataSourceChange.
   */
  setPageData(page: number);

  /**
   * Set datasource with a getAll and pass the filter to apply.
   * See comment of : dataSourceChange.
   */
  setFilterData(filter: any);

  /**
   * Action to process when clicking on the corresponding ActionType.
   * To be used as follow :
   * switch (actionEvent.action) {
   *   case ActionType.OPEN:
   *     this.exampleOpenAction(actionEvent.event);
   *     ...
   */
  clickEvent?(actionEvent: ActionEvent);

  /**
   * Action to process when the selection changes.
   */
  selectionEvent?(selection: SelectionModel<any>);

  /**
   * Action to process when the favorite changes.
   */
  favoriteEvent?(favorite: SelectionModel<any>);

  /**
   * Get the list of status
   *
   * @return [{name: e, value: this.getStatusName(e)}, ...]
   * Where 'e' is the value of the status, for each status values
   */
  getStatusList?: () => { name: string, value: string }[] | undefined;
  /**
   * Get the status name for the given key
   */
  getStatusName?: (key: any) => string | undefined;
  /**
   * Get the color class, defined in style.scss, for the given key
   */
  getStatusColor?: (key: any) => string | undefined;
  /**
   * Get the router link to access details of the given row.
   * Column name can be set to call different routes, if so,
   * you have to specify that the column is clickable in columnInfos.
   */
  getRouterLink?: (columnName: string, row: TableLine) => string[] | undefined;
  /**
   * Get the list of values for filters of type CHECK or COMBO
   *
   * @return {attr1: string[], ...}
   * Where 'attr1' is the same name as the attribute in the TableLine interface
   */
  getComboList?: () => DynamicKeyValue | undefined;
  /**
   * Notify when component is ready
   */
  isReady?: () => any;
}

@Component({
  selector: 'app-table-search-list',
  templateUrl: './table-search-list.component.html',
  styleUrls: ['./table-search-list.component.scss']
})
export class TableSearchListComponent implements OnInit {

  @Input() loadEmitter: EventEmitter<boolean>;
  @Input() displayedColumns: string[];
  @Input() hiddenColumns: string[];
  @Input() columnsInfos: ColumnInformation[];
  @Input() maxRows: number;
  @Input() options: TableOption[];
  @Input() sidePanelType: SidePanelType;
  @Input() dataSourceChange: EventEmitter<{ dataSource: MatTableDataSource<TableLine>, filter?: string | MatSort }>;
  @Input() router: (columnName: string, row: any) => string[];
  @Input() comboList: () => DynamicKeyValue;
  @Input() statusList: () => { name: string, value: string }[];
  @Input() statusName: (key: any) => string;
  @Input() statusColor: (key: any) => string;
  @Input() createAction: { label: string, disabled: boolean, hidden: boolean, create: () => any };

  @Output() clickEvent = new EventEmitter<ActionEvent>();
  @Output() pageData = new EventEmitter<number>();
  @Output() filterData = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectionModel<any>>();
  @Output() favoriteChange = new EventEmitter<SelectionModel<any>>();
  @Output() isReady = new EventEmitter<void>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  isLoading: boolean;
  dataSource = new MatTableDataSource<any>();
  suggestedValues: string[];
  isFiltered: boolean;
  defaultDisplayedColumns: string[];
  label: any[];
  currentComboList: DynamicKeyValue;
  currentStatusList: { name: string, value: string }[];
  page: number;
  selection = new SelectionModel<any>(true, []);
  favorite = new SelectionModel<any>(true, []);
  filter: DynamicKeyValue[];
  filteredValues = new Map();
  filterTypes = {
    TEXT: FilterType.TEXT,
    NUMBER: FilterType.NUMBER,
    DATE: FilterType.DATE,
    DATE_SHORT: FilterType.DATE_SHORT,
    CHECK: FilterType.CHECK,
    BOOLEAN: FilterType.BOOLEAN,
    COMBO: FilterType.COMBO,
    STATUS: FilterType.STATUS,
    ACCOUNT: FilterType.ACCOUNT,
    MARKET: FilterType.MARKET
  };
  actionTypes = {
    OPEN_PREVIEW: ActionType.OPEN_PREVIEW,
    OPEN_DIALOG: ActionType.OPEN_DIALOG,
    EDIT: ActionType.EDIT,
    DELETE: ActionType.DELETE,
    ACTIVATE: ActionType.ACTIVATE,
    DEACTIVATE: ActionType.DEACTIVATE,
    DUPLICATE: ActionType.DUPLICATE,
    ADD: ActionType.ADD,
    REMOVE: ActionType.REMOVE,
    START: ActionType.START,
    CREDIT_NOTE: ActionType.CREDIT_NOTE,
    PDF: ActionType.PDF
  };
  optionTypes = {
    SELECT: TableOption.SELECT,
    PICK: TableOption.PICK,
    FAVORITE: TableOption.FAVORITE,
    PREVIEW: TableOption.PREVIEW,
    ACTION: TableOption.ACTION,
    ACTION_BILL: TableOption.ACTION_BILL,
    EDIT: TableOption.EDIT,
    DUPLICATE: TableOption.DUPLICATE,
    DELETE: TableOption.DELETE,
    START: TableOption.START,
    REORDER: TableOption.REORDER,
    OPEN_DIALOG: TableOption.OPEN_DIALOG
  };
  nbColumns: number;

  constructor(private marketsService: MarketsService,
              private accountsService: AccountsService,
              private sidePanelService: SidePanelService,
              protected dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.loadEmitter.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.nbColumns = this.displayedColumns.length;
    this.filter = [];
    this.columnsInfos.forEach(e => {
      this.filter[e.name] = '';
      this.filteredValues.set(e.name, '');
    });
    this.currentStatusList = this.statusList ? this.statusList() : undefined;
    this.currentComboList = this.comboList ? this.comboList() : undefined;
    this.label = [];
    this.defaultDisplayedColumns = [];
    this.displayedColumns.forEach(e => {
      this.defaultDisplayedColumns.push(e);
      const info = this.columnsInfos.filter(i => e === i.name)[0];
      this.label.push({name: info.name, value: info.title});
    });
    this.hiddenColumns.forEach(e => {
      const info = this.columnsInfos.filter(i => e === i.name)[0];
      this.label.push({name: info.name, value: info.title});
    });
    if (this.getUserSettings()) {
      this.displayedColumns = this.getUserSettings()[0];
      this.hiddenColumns = this.getUserSettings()[1];
    }
    this.setupFilter();
    this.dataSourceChange.subscribe((data) => {
      this.selection.clear();
      this.selectionChange.emit(new SelectionModel<any>());
      this.dataSource.data = data.dataSource.data;
      this.dataSource._updateChangeSubscription();
      this.dataSource.filter = data.filter;
      this.dataSource.paginator = this.paginator;
      this.isFiltered = data.filter !== null;
      this.setOptions();
    });
    this.setPage(0);
  }

  togglePick(event: MatCheckboxChange, element: any) {
    this.selection.clear();
    if (event.checked) {
      this.selection.select(element);
    }
    this.selectionChange.emit(this.selection);
  }

  setOptions() {
    this.displayedColumns = this.displayedColumns.filter(c => c !== 'opt_start' && c !== 'opt_end');
    if (this.options.includes(TableOption.FAVORITE) || this.options.includes(TableOption.SELECT) || this.options.includes(TableOption.PICK) || this.dataSource.data.find(d => !!d.lineIcon)) {
      this.displayedColumns.unshift('opt_start');
    }
    if (this.options.includes(TableOption.PREVIEW) || this.options.includes(TableOption.ACTION) || this.options.includes(TableOption.ACTION_BILL)
      || this.options.includes(TableOption.EDIT) || this.options.includes(TableOption.DELETE)
      || this.options.includes(TableOption.DUPLICATE) || this.options.includes(TableOption.START)) {
      this.displayedColumns.push('opt_end');
    }
  }

  setupFilter() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchString = JSON.parse(filter);
      let result = true;
      Object.keys(data).forEach(e => {
        if (result) {
          if ((data[e] === undefined || data[e] === null || data[e].toString().trim().toLowerCase() === '') && searchString[e] !== undefined && searchString[e] !== null && searchString[e].toString().trim().toLowerCase() !== '') {
            result = false;
          } else if (data[e] !== undefined && data[e] !== null && data[e].toString().trim().toLowerCase() !== '' && searchString[e] !== undefined && searchString[e] !== null && searchString[e].toString().trim().toLowerCase() !== '') {
            const infos = this.columnsInfos.filter(c => c.name === e)[0];
            const type = infos ? infos.filterType : null;
            if (type === FilterType.COMBO) {
              searchString[e].split(', ').forEach(s => {
                if (data[e].toString().trim().toLowerCase().indexOf(s.toLowerCase()) === -1) {
                  result = false;
                }
              });
            } else if (type === FilterType.STATUS) {
              if (data[e].toString().trim().toLowerCase() !== searchString[e].toString().trim().toLowerCase()) {
                result = false;
              }
            } else if (data[e].toString().trim().toLowerCase().indexOf(searchString[e].toLowerCase()) === -1) {
              result = false;
            }
          }
        }
      });
      return result;
    };
  }

  applyFilter(column: string, filterType: FilterType, filterValue: any) {
    this.selection.clear();
    switch (filterType) {
      case FilterType.MARKET:
        if (filterValue && filterValue.length > 2) {
          this.marketsService.suggest(filterValue).pipe(debounceTime(500)).subscribe((results) => {
            this.suggestedValues = results.map((result) => result.name);
          });
        }
        this.filteredValues.set(column, filterValue.trim().toLowerCase());
        break;
      case FilterType.ACCOUNT:
        if (filterValue && filterValue.length > 2) {
          this.accountsService.search(filterValue).pipe(debounceTime(500)).subscribe((results) => {
            this.suggestedValues = results.map((result) => AccountUtils.getName(result));
          });
        }
        this.filteredValues.set(column, filterValue.trim().toLowerCase());
        break;
      case FilterType.COMBO:
        this.filteredValues.set(column, filterValue.join(', ').trim().toLowerCase());
        break;
      case FilterType.NUMBER:
      case FilterType.DATE:
      case FilterType.STATUS:
        this.filteredValues.set(column, filterValue);
        break;
      case FilterType.CHECK:
      case FilterType.TEXT:
        this.filteredValues.set(column, filterValue.trim().toLowerCase());
        break;
      default:
        break;
    }
    this.dataSource.filter = this.stringify(this.filteredValues);
  }

  resetFilters() {
    this.columnsInfos.forEach(e => {
      this.filter[e.name] = '';
      this.filteredValues.set(e.name, '');
    });
    // this.setPage(0);
    this.dataSource.filter = this.stringify(this.filteredValues);
    this.sortData(null);
  }

  stringify(map: Map<string, string>) {
    let result = '{';
    map.forEach((value, key) => {
      if (result !== '{') {
        result += ',';
      }
      result += '"' + key + '":"' + value + '"';
    });
    result += '}';
    return result;
  }

  parse(filter: string): Map<string, string> {
    const result = new Map<string, string>();
    filter = filter.replace('{', '').replace('}', '');
    filter.split(',').forEach(values => {
      values = values.replace(/"/g, '');
      result.set(values.split(':')[0], values.split(':')[1]);
    });
    return result;
  }

  onClick(action: ActionType, event: any) {
    const actionEvent: ActionEvent = {
      action: action,
      event: event
    };
    this.clickEvent.emit(actionEvent);
  }

  showOptions() {
    const display = [];
    const options = [];
    Object.values(this.optionTypes).forEach(e => options.push(e));
    this.displayedColumns.forEach(e => {
      if (e !== 'opt_start' && e !== 'opt_end') {
        display.push(e);
      }
    });
    const dialogRef = this.dialog.open(TableSearchListDialogComponent, {
      data: {
        display: display,
        hide: this.hiddenColumns,
        defaultDisplay: this.defaultDisplayedColumns,
        label: this.label
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.displayedColumns = display;
      this.setOptions();
    });
  }

  toggleSidePanel(element: any) {
    this.sidePanelService.toggle(this.sidePanelType, element);
  }

  getUserSettings() {
    // TODO
    // const settings = this.userService.getCurrentUser().getPreferences();
    // return settings && settings[this.dataType] ? settings[this.dataType] : null;
    return null;
  }

  unselect(column: string, filterType: FilterType) {
    this.filter[column] = undefined;
    this.applyFilter(column, filterType, '');
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  sortState = '';
  sortData(sort: Sort) {
    if (!sort) {
      // Reset sort arrow
      this.columnsInfos.forEach(c => {
        if (c.filterType === FilterType.DATE || c.filterType === FilterType.DATE_SHORT) {
          if (this.sortState !== '') {
            this.sort.sort({
              id: c.name,
              start: null,
              disableClear: false
            });
            if (this.sortState === 'desc') {
              this.sort.sort({
                id: c.name,
                start: null,
                disableClear: false
              });
            }
          }
        }
      });
    } else if (!sort.active || sort.direction === '') {
      this.sortState = sort.direction;
      this.dataSource.data = this.dataSource.data.sort((a, b) => {
        return this.compare(a.position, b.position, true);
      });
    } else {
      this.sortState = sort.direction;
      this.dataSource.data = this.dataSource.data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        return this.compare(a[sort.active], b[sort.active], isAsc);
      });
    }
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  setPage(page: number) {
    this.sort.active = '';
    this.sort.direction = '';
    this.sort._stateChanges.next();
    this.dataSource.data = [];
    this.page = page;
    this.isFiltered = false;
    this.pageData.emit(page);
  }

  setFilterPage(filter: any) {
    this.dataSource.data = [];
    this.page = 0;
    this.filterData.emit(filter);
  }

  getObjectValueFromPath(path, obj): string {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj || self);
  }

  buildRouterLink(column, obj): string[] {
    const parts = column.routerLink(obj).split('/');
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
}

export interface ColumnInformation {
  name: string;
  title: string;
  filterType: FilterType;
  filterDisabled: boolean;
  maxWidthPx?: number;
  clickable?: boolean;
  headerToolTip?: string;
  buttonToolTip?: boolean;
  routerLink?: (elem) => string;
}

export class DynamicKeyValue {
  [key: string]: any;

  constructor(key: string, value: any) {
    this[key] = value;
  }
}

export enum FilterType {
  TEXT,
  NUMBER,
  DATE,
  DATE_SHORT,
  MARKET,
  Lin,
  ACCOUNT,
  STATUS,
  COMBO,
  CHECK,
  BOOLEAN
}

export enum TableOption {
  // onChange -> Emit selectionEvent()
  SELECT,
  // onChange -> Emit selectionEvent()
  PICK,
  // onChange -> Emit favoriteEvent()
  FAVORITE,
  // onClick -> IMPORTANT!
  // - if sidePanelType is defined: Call toggleSidePanel(sidePanelType, element)
  // - if not: Emit clickEvent({action = ActionType.OPEN_PREVIEW, event: element})
  PREVIEW,
  // onClick -> Emit clickEvent({action = ActionType.x, event: element}) where 'x' depends on the action of the menu
  ACTION,
  // onClick -> Emit clickEvent({action = ActionType.x, event: element}) where 'x' depends on the action of the menu
  ACTION_BILL,
  // onClick -> Emit clickEvent({action = ActionType.EDIT, event: element})
  EDIT,
  // onClick -> Emit clickEvent({action = ActionType.DUPLICATE, event: element})
  DUPLICATE,
  // onClick -> Emit clickEvent({action = ActionType.START, event: element})
  // IMPORTANT: The attribute 'isStarted' must be defined in the TableLine interface and set to true or false (to hide or display button)
  START,
  // onClick -> Emit clickEvent({action = ActionType.DELETE, event: element})
  // IMPORTANT: The attribute 'deletable' must be defined in the TableLine interface and set to true or false
  DELETE,
  // Display reorder button
  REORDER,
  // Display preview estate button
  OPEN_DIALOG
}

export enum ActionType {
  OPEN_PREVIEW,
  OPEN_DIALOG,
  EDIT,
  DELETE,
  ACTIVATE,
  DEACTIVATE,
  DUPLICATE,
  ADD,
  REMOVE,
  START,
  // Specifics
  CREDIT_NOTE,
  PDF
}

export interface TableLine {
  id: string;
  position?: number;
  actionDisabled?: boolean; // Disable all buttons
  hasError?: boolean; // Display empty line
  lineIcon?: {icon: string, tooltip: string}; // Display icon at line start
  keepActiveOpenDialog?: boolean; // Keep open_dialog button active if actionDisabled = true
  unclickable?: string; // render a column unclickable for this row, even if column is clickable. Change to array if needed
}

export interface DeletableTableLine extends TableLine {
  deletable: boolean;
}

export interface ActionEvent {
  action: ActionType;
  event: any;
}

@Component({
  selector: 'app-table-search-list-dialog',
  templateUrl: './table-search-list-dialog.component.html',
  styleUrls: ['./table-search-list.component.scss']
})
export class TableSearchListDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: DisplayDialogData) {
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  defaultSettings() {
    this.data.defaultDisplay.forEach(e => {
      if (!this.data.display.includes(e)) {
        transferArrayItem(this.data.hide,
          this.data.display,
          this.data.hide.indexOf(e),
          this.data.defaultDisplay.indexOf(e));
      } else if (this.data.display.indexOf(e) !== this.data.defaultDisplay.indexOf(e)) {
        moveItemInArray(this.data.display, this.data.display.indexOf(e), this.data.defaultDisplay.indexOf(e));
      }
    });
    while (this.data.display.length > this.data.defaultDisplay.length) {
      transferArrayItem(this.data.display,
        this.data.hide,
        this.data.display.length,
        this.data.hide.length);
    }
  }

  saveSettings() {
    // TODO
    console.log('Save settings is not implemented');
  }

  getName(column: string) {
    const result = this.data.label.filter(e => e.name === column)[0];
    return result ? result.value : '';
  }
}

export interface DisplayDialogData {
  display: string[];
  hide: string[];
  defaultDisplay: string[];
  label: [{ name: string, value: string }];
}
