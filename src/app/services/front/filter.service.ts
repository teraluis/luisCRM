import {Injectable, OnInit} from '@angular/core';

@Injectable()
export class FilterService implements OnInit {
  filter: { [key: string]: string } = {};
  filteredValues = new Map();
  filterTypes = {
    TEXT: FilterType.TEXT,
    NUMBER: FilterType.NUMBER,
    DATE: FilterType.DATE,
    DATE_SHORT: FilterType.DATE_SHORT,
    CHECK: FilterType.CHECK,
    BOOLEAN: FilterType.BOOLEAN,
    COMBO: FilterType.COMBO,
    STATUS: FilterType.STATUS
  };
  isFiltered: boolean;
  filterInfos: FilterInfo[];

  ngOnInit() {
    this.resetFilters();
  }

  setupFilter = (data: any, filter: string) => {
    const searchString = JSON.parse(filter);
    let result = true;
    Object.keys(data).forEach(e => {
      if (result) {
        if ((data[e] === undefined || data[e] === null || data[e].toString().trim().toLowerCase() === '') && searchString[e] !== undefined && searchString[e] !== null && searchString[e].toString().trim().toLowerCase() !== '') {
          result = false;
        } else if (data[e] !== undefined && data[e] !== null && data[e].toString().trim().toLowerCase() !== '' && searchString[e] !== undefined && searchString[e] !== null && searchString[e].toString().trim().toLowerCase() !== '') {
          const infos = this.filterInfos.filter(c => c.name === e)[0];
          const type = infos ? infos.type : null;
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
  }

  applyFilter(column: string, filterType: FilterType, filterValue: any) {
    switch (filterType) {
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
    if (this.isFiltered && !this.getActiveFilter(this.filteredValues)) {
      this.isFiltered = false;
    }
    return this.stringify(this.filteredValues);
  }

  resetFilters() {
    this.filterInfos.forEach(e => {
      this.filter[e.name] = '';
      this.filteredValues.set(e.name, '');
    });
    this.isFiltered = false;
  }

  getActiveFilter(filters: string | Map<string, string>) {
    let result = null;
    if (!(filters instanceof Map)) {
      filters = this.parse(filters);
    }
    filters.forEach((value, key) => {
      if (value !== '') {
        result = key;
      }
    });
    return result;
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

  static hasElementsInCommon(array1, array2): boolean {
    return array1.filter(a => array2.indexOf(a) > -1).length > 0;
  }

}

export interface FilterInfo {
  name: string;
  label: string;
  type: FilterType;
}

export enum FilterType {
  TEXT,
  NUMBER,
  DATE,
  DATE_SHORT,
  STATUS,
  COMBO,
  CHECK,
  BOOLEAN
}
