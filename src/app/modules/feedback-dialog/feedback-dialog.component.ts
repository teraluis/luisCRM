import {Component, OnInit} from '@angular/core';
import {FeedbackService} from '../../services/backend/feedback.service';
import {InfoService} from '../../services/front/info.service';
import {MatDialogRef} from '@angular/material';
import {NavigationService} from '../../services/front/navigation.service';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss']
})
export class FeedbackDialogComponent implements OnInit {

  file: File;
  fileName: string;
  comment: string;

  constructor(private dialogRef: MatDialogRef<FeedbackDialogComponent>, protected navigationService: NavigationService, protected feedbackService: FeedbackService, private infoService: InfoService) {
  }

  ngOnInit() {
  }

  preventEventKeyboard(event) {
    event.preventDefault();
  }

  sendMessage() {
    if (this.comment && this.comment !== '') {
      const text = this.comment + '\n\nL\'utilisateur a posté depuis : ' + this.navigationService.url + '.';
      this.feedbackService.post(text, this.file).subscribe((result) => {
        if (result === true) {
          this.dialogRef.close();
          this.fileName = '';
          this.comment = null;
          this.file = null;
          this.infoService.displaySuccess('Votre commentaire a été envoyé à l\'équipe responsable !');
        }
      });
    } else {
      this.infoService.displayError('Veuillez entrer un commentaire.');
    }
  }

  loadFile(event) {
    this.file = event.target.files.item(0);
    this.fileName = this.file.name;
  }

}
