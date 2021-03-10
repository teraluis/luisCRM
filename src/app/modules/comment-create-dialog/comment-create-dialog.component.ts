import {Component, Inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {UsersService} from '../../services/backend/users.service';
import {DataComment} from '../events/events.component';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-comment-create-dialog',
  templateUrl: './comment-create-dialog.component.html',
  styleUrls: ['./comment-create-dialog.component.scss']
})
export class CommentCreateDialogComponent implements OnInit {

  loading = false;
  comment: string;
  newComment: DataComment;

  constructor(@Inject(MAT_DIALOG_DATA) public data: CommentDialogData,
              public dialogRef: MatDialogRef<CommentCreateDialogComponent>,
              private usersService: UsersService) {
  }

  ngOnInit() {
    this.newComment = {comment: '', created: undefined, user: undefined, eventType: this.data ? this.data.eventType : undefined};
  }

  save() {
    this.loading = true;
    this.usersService.get(localStorage.getItem('username')).subscribe((user) => {
      this.loading = false;
      this.newComment.created = new Date();
      this.newComment.user = user;
      this.newComment.comment = this.data.prefix ? this.data.prefix + this.comment : this.comment;
      this.dialogRef.close(this.newComment);
    });
  }
}

export interface CommentDialogData {
  title?: string;
  message?: string;
  eventType?: string;
  prefix?: string;
}
