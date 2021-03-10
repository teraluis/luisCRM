import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SortDirection} from '@angular/material/sort/typings/sort-direction';
import {Sort} from '../Sort';

export abstract class AbstractService<T> {

  abstract get(filter, sort, pageIndex, pageSize): Observable<{ data: T[], total: number }>;

  setHttpParams(filter: any, sort: Sort, pageIndex = 0, pageSize = 10): HttpParams {
    let params = new HttpParams();

    params = params.append('pageNumber', pageIndex.toString());
    params = params.append('pageSize', pageSize.toString());

    if (sort && sort.direction) {
      // multi-sort : ?sort_by=desc(last_modified),asc(email)
      params = params.append('sort_by', `${sort.direction}(${this.setSortFieldName(sort)})`);
    }

    if (filter && this.getFilters(filter).length) {
      params = params.append('q', this.transformFilter(filter));
    }
    return params;
  }

  private setSortFieldName(sort: { field: string, type: 'text' | 'other', direction: SortDirection }) {
    if (sort.type === 'other') {
      return sort.field;
    }
    return sort.field + '.keyword';
  }

  private getFilters(filter): any[] {
    return Object.keys(filter).filter(e => filter[e] || typeof filter[e] === 'number');
  }

  // lucene syntax
  private transformFilter(data): string {
    return this.getFilters(data).map(key => `${key}:${this.transformValue(data[key])}`).join(' AND ');
  }

  private transformValue(value: any): any {
    if (Array.isArray(value) && value.length) {
      return `("${value.join('" "')}")`;
    }

    if (typeof value === 'object') {
      if (value.begin && value.end) {
        return `[${value.begin.set({second: 0}).valueOf()} TO ${value.end.set({
          hour: 23,
          minute: 59,
          second: 59
        }).valueOf()}]`;
      }
    }


    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return '*' + value + '*';
  }
}
