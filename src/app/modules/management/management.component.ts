import {Component, OnInit} from '@angular/core';
import {ManagementService} from '../../services/backend/management.service';
import {InfoService} from '../../services/front/info.service';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  workInProgress = false;

  billStartDate: number;
  billEndDate: number;
  paymentStartDate: number;
  paymentEndDate: number;
  recoveryStartDate: number;
  recoveryEndDate: number;
  inProgressStartDate: number;
  inProgressEndDate: number;

  constructor(private managementService: ManagementService, private infoService: InfoService) {
  }

  ngOnInit() {
  }

  exportBills() {
    this.workInProgress = true;
    if (this.billStartDate && this.billEndDate) {
      this.managementService.exportBills(this.billStartDate, this.billEndDate).subscribe((file) => {
        this.workInProgress = false;
        if (file) {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(file.image);
          link.download = file.fileName;
          link.click();
        }
      });
    } else {
      this.infoService.displayError('Les dates de début et de fin doivent être renseignées.');
    }
  }

  exportPayments() {
    if (this.paymentStartDate && this.paymentEndDate) {
      this.managementService.exportPayments(this.paymentStartDate, this.paymentEndDate).subscribe((file) => {
        this.workInProgress = false;
        if (file) {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(file.image);
          link.download = file.fileName;
          link.click();
        }
      });
    } else {
      this.infoService.displayError('Les dates de début et de fin doivent être renseignées.');
    }
  }

  exportRecovery() {
    if (this.recoveryStartDate && this.recoveryEndDate) {
      this.managementService.exportRecovery(this.recoveryStartDate, this.recoveryEndDate).subscribe((file) => {
        this.workInProgress = false;
        if (file) {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(file.image);
          link.download = file.fileName;
          link.click();
        }
      });
    } else {
      this.infoService.displayError('Les dates de début et de fin doivent être renseignées.');
    }
  }

  exportInProgress() {
    if (this.inProgressStartDate && this.inProgressEndDate) {
      this.managementService.exportInProgress(this.inProgressStartDate, this.inProgressEndDate).subscribe((file) => {
        this.workInProgress = false;
        if (file) {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(file.image);
          link.download = file.fileName;
          link.click();
        }
      });
    } else {
      this.infoService.displayError('Les dates de début et de fin doivent être renseignées.');
    }
  }
}
