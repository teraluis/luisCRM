import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {IUser, UsersService} from "../../services/backend/users.service";
import {ManagementRights} from "../../core/rights/ManagementRights";

/**
 * Interface to be implemented to use the following component :
 * <app-events [headIcon]="'icon_name'" [dataComment]="dataComments" [ascending]="ascending" [disabled]="disabled" (orderChanged)="orderChanged()" (sendComment)="saveComment($event)"></app-events>
 */

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  @Input() headIcon = "comment";
  @Input() dataComment: DataComment[] = [];
  @Input() disabled: boolean;
  @Input() ascending = false;

  @Output() sendComment = new EventEmitter<DataComment>();
  @Output() orderChanged = new EventEmitter<void>();

  loading = false;
  newComment = '';
  displayComment = false;
  commentToDisplay: string;
  displayDate: Date = null;
  user: IUser;
  displayUser: IUser;
  displayEvent: EventType = EventType.MESSAGE;
  status: EventType = EventType.STATUS;
  modification: EventType = EventType.MODIFICATION;
  message: EventType = EventType.MESSAGE;

  constructor(private usersService: UsersService) {
  }

  ngOnInit() {
    this.loading = true;
    this.dataComment = sortComments(this.ascending, this.dataComment);
    this.usersService.get(this.getUserName()).subscribe((user) => {
      this.user = user;
      this.loading = false;
    });
  }
  getUserName() {
    return localStorage.getItem('username');
  }
  formatComment(comment): string {
    const size = 20;
    if (comment !== undefined) {
      if ( comment.length > size) {
        return comment.substring(0, size - 1) + '...';
      } else {
        return comment;
      }
    } else {
      return '';
    }
  }


  initials(user: IUser): string {
    if (user === null || user === undefined) {
      return 'SUP';
    } else {
      return user.first_name.charAt(0) + '.' + user.last_name.substring(0, 2).toUpperCase();
    }
  }

  save() {
    const dataComment: DataComment = {
      comment: this.newComment,
      user: this.user,
      created: new Date()
    };
    this.sendComment.emit(dataComment);
    this.newComment = '';
  }

  displayCommentInBox(comment: string, date: Date, user: IUser, eventType: string) {
    this.commentToDisplay = comment;
    this.displayComment = true;
    this.displayDate = date;
    this.displayUser = user;
    this.displayEvent = this.getEventType(eventType);
  }
  getEventType(typeName: string) {
    switch (typeName) {
      case EventType.STATUS.toString() : return EventType.STATUS;
                                         break;
      case EventType.MODIFICATION.toString() : return  EventType.MODIFICATION;
                                               break;
      default:
        return EventType.MESSAGE;
        break;
    }
  }

  sort() {
    this.ascending = !this.ascending;
    this.orderChanged.emit();
    if (this.ascending) {
      this.dataComment = this.dataComment.slice().sort( (a, b) => a.created.getTime() - b.created.getTime());
    } else {
      this.dataComment = this.dataComment.slice().sort( (a, b) => b.created.getTime() - a.created.getTime());
    }
  }
  getMessageTooltip(): string {
    if (this.ascending) {
      return 'Tri d\'événements par date décroissante';
    } else {
      return 'Tri d\'événements par date croissante';
    }
  }
}

export interface DataComment {
  comment: string;
  user?: IUser;
  eventType?: string;
  created: Date;
}

export enum EventType {
  STATUS = "STATUS",
  MODIFICATION = "MODIFICATION",
  MESSAGE = "MESSAGE"
}

export function sortComments(ascending: boolean, dataComment: DataComment []): DataComment [] {
  let tmpDataComment: DataComment[] = [];
  if (!ascending) {
    tmpDataComment = dataComment.slice().sort((a, b) => b.created.getTime() - a.created.getTime());
  } else {
    tmpDataComment = dataComment.slice().sort((a, b) => a.created.getTime() - b.created.getTime());
  }
  return tmpDataComment;
}

