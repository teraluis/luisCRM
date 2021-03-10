import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';


@Injectable()
export class FeedbackFrontService {

  feedbackSubject = new Subject<boolean>();
  feedbackState: boolean = false;

  open() {
    if (!this.feedbackState) {
      this.feedbackSubject.next(true);
      this.feedbackState = true;
    }
  }

  close() {
    if (this.feedbackState) {
      this.feedbackSubject.next(false);
      this.feedbackState = false;
    }
  }

}
