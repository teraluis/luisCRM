import {Component, Inject, OnInit} from '@angular/core';
import {FeedbackFrontService} from '../../services/front/feedback-front.service';
import {MAT_SNACK_BAR_DATA} from '@angular/material';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ErrorSnack, private feedbackService: FeedbackFrontService) {
  }

  ngOnInit() {
  }

  openFeedback() {
    this.feedbackService.open();
  }

}

export interface ErrorSnack {
  line1: string;
  line2?: string;
  clickable?: boolean;
}
