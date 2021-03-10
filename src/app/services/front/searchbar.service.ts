import {Observable, Subject} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable()
export class SearchbarService {

  private storageSub = new Subject<string>();
  public searchvalue: string;

  watchSearchbar(): Observable<any> {
    return this.storageSub.asObservable();
  }

  setSearchbar(searchvalue: string) {
    this.searchvalue = searchvalue;
    this.storageSub.next('modification');
  }

  validateSearchbar() {
    this.storageSub.next('validation');
  }

}
