import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {ErrorComponent} from '../../modules/error/error.component';

@Injectable()
export class InfoService {

  private displayMessage(message1: string, message2: string, error: boolean, duration = 4000, stackClass = [], clickable: boolean = true) {
    if (this.running) {
      this.stack.push({
        message1: message1,
        message2: message2,
        error: error,
        clickable: clickable,
        duration: duration,
        stackClass: stackClass
      });
    } else {
      this.stack.push({
        message1: message1,
        message2: message2,
        error: error,
        clickable: clickable,
        duration: duration,
        stackClass: stackClass
      });
      this.showInfos();
    }
  }

  constructor(private snackBar: MatSnackBar) {
  }

  displayInfo(message: string, duration = 4000) {
    this.displayMessage(message, null, false, duration, ['snackbar']);
  }

  displaySuccess(message: string, duration = 4000) {
    this.displayMessage(message, null, false, duration, ['green-snackbar']);
  }

  displayError(message1: string, message2: string = null, duration = 4000, clickable: boolean = true) {
    this.displayMessage(message1, message2, true, duration, ['red-snackbar'], clickable);
  }

  displayWarning(message: string, duration = 4000) {
    this.displayMessage(message, null, false, duration, ['orange-snackbar']);

  }

  displaySaveSuccess() {
    this.displaySuccess('Les informations renseignées ont bien été sauvegardées');
  }

  protected stack = new Array<{ message1: string, message2?: string, error: boolean, clickable: boolean, duration: number, stackClass: Array<string> }>();

  running = false;

  showInfos() {
    const message = this.stack.pop();

    if (message) {
      this.running = true;
      if (!message.error) {
        this.snackBar.open(message.message1, '', {
          duration: message.duration,
          panelClass: message.stackClass
        }).afterDismissed().subscribe(success => this.showInfos());
      } else {
        this.snackBar.openFromComponent(ErrorComponent, {
          duration: message.duration,
          panelClass: message.stackClass,
          data: {line1: message.message1, line2: message.message2, clickable: message.clickable}
        }).afterDismissed().subscribe(success => this.showInfos());
      }
    } else {
      this.running = false;
    }
  }


}
