import {Component, Inject, OnInit} from '@angular/core';
import {BillData, FullBill} from '../bill/bill.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {DataComment, sortComments} from '../events/events.component';
import {BillComment, BillsService} from '../../services/backend/bills.service';
import {ManagementRights} from '../../core/rights/ManagementRights';

@Component({
  selector: 'app-bill-modal',
  templateUrl: './bill-modal.component.html',
  styleUrls: ['./bill-modal.component.scss']
})
export class BillModalComponent implements OnInit {

  userRights: ManagementRights = new ManagementRights();

  constructor(private dialogRef: MatDialogRef<BillModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: BillData, private billsService: BillsService) {
  }

  ngOnInit() {
  }

  closeModal(fullBill: FullBill) {
    this.dialogRef.close(fullBill);
  }

  quitModal(bool: boolean) {
    this.dialogRef.close(bool);
  }

}
