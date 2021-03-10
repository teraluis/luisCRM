import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class LockService {

  lockSubject = new Subject<boolean>();
  lockState = false;
  forceQuit = new Subject<string>();

  lock() {
    if (!this.lockState) {
      this.lockSubject.next(true);
      this.lockState = true;
    }
  }

  unlock() {
    if (this.lockState) {
      this.lockSubject.next(null);
      this.lockState = false;
    }
  }

}
