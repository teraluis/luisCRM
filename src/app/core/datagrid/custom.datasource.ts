import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, finalize} from 'rxjs/operators';
import {AbstractService} from './service/abstract.service';
import {SortDirection} from '@angular/material/sort';

export class CustomDatasource<T> implements DataSource<T> {
  protected entitySubject = new BehaviorSubject<T[]>([]);
  protected loadingSubject = new BehaviorSubject<boolean>(false);
  public resultCount = new BehaviorSubject<number>(0);
  public loading = this.loadingSubject.asObservable();

  constructor(public service: AbstractService<T>) {
  }

  load(filter: string, sort: {field: string, type: 'text' | 'other', direction: SortDirection}, pageIndex: number, pageSize: number): void {
    this.loadingSubject.next(true);
    this.service.get(filter, sort, pageIndex, pageSize).pipe(
      catchError(() => of([])),
      finalize(() => this.loadingSubject.next(false))
    ).subscribe((res: { data: T[], total: number }) => {
      // @ts-ignore
      res.data = res.data.map((e, i) => (e.index = i, e));
      this.entitySubject.next(res.data);
      this.resultCount.next(res.total);
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<T[] | ReadonlyArray<T>> {
    return this.entitySubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.entitySubject.complete();
    this.loadingSubject.complete();
  }
}
