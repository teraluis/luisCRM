import {
  Component, Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {MatSelect, MatSelectChange} from '@angular/material/select';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {AttachmentsService} from "../../services/backend/attachments.service";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {

  @ViewChild('fileInput') fileInputElement: ElementRef;
  @ViewChild('type') typeField: MatSelect;
  @ViewChild('otherType') otherTypeField: ElementRef;

  @Input() fileTypes: AttachmentType[];
  @Input() attachments: Attachment[];
  @Input() updateList: EventEmitter<void>;
  @Input() disabled: boolean;

  @Output() upload = new EventEmitter<Attachment>();
  @Output() download = new EventEmitter<Attachment>();
  @Output() remove = new EventEmitter<Attachment>();

  selectedFileType: string;
  otherType = false;
  otherFileType: string;
  currentFile: File;
  currentFileName: string;
  typeList: string[];
  objectList: AttachmentObject[] = [];
  objectIdList: string[];
  selectedId: string;
  selectedObject: AttachmentObject;
  isLoading = true;
  history: Attachment[] = [];
  loadHistory = false;

  constructor(private dialog: MatDialog,
              private attachmentsService: AttachmentsService) {
  }

  ngOnInit() {
    this.initialize();
    if (this.updateList) {
      this.updateList.subscribe(() => {
        this.initialize();
      });
    }
  }

  initialize() {
    this.typeList = [];
    this.objectIdList = [];
    this.fileTypes.forEach((fileType) => {
      if (fileType.types) {
        fileType.types.forEach(type => this.typeList.push(type));
      }
    });
    this.selectedFileType = this.typeList.length === 1 ? this.typeList[0] : null;
    if (this.selectedFileType) {
      if (this.fileTypes[0].objects.length === 1) {
        this.selectedObject = this.fileTypes[0].objects[0];
        this.selectedId = this.selectedObject.id;
      } else {
        this.objectIdList = this.fileTypes[0].objects.map(obj => obj.id);
      }
    }
    this.otherFileType = null;
    this.currentFile = null;
    this.currentFileName = null;
    this.isLoading = false;
  }

  preventEventKeyboard(event) {
    event.preventDefault();
  }

  changeType() {
    const fileType = this.fileTypes.filter((type) => type.types.includes(this.selectedFileType))[0];
    if (fileType.objects.length === 1) {
      this.selectedObject = fileType.objects[0];
      this.selectedId = this.selectedObject.id;
      this.objectIdList = [];
    } else {
      this.selectedObject = null;
      this.selectedId = null;
      this.objectIdList = fileType.objects.map(obj => obj.id);
    }
    // TODO: Manage other if needed in future
    if (this.selectedFileType === 'OTHER') {
      this.otherType = true;
      setTimeout(() => this.otherTypeField.nativeElement.focus());
    } else {
      this.otherType = false;
    }
  }

  clearOtherInput() {
    setTimeout(() => this.typeField.open());
  }

  onFileChange(files: FileList) {
    this.currentFile = files.item(0);
    this.currentFileName = this.currentFile.name;
    this.fileInputElement.nativeElement.value = '';
  }

  viewHistory(e) {
    this.loadHistory = true;
    this.history = [];
    this.attachmentsService.getHistory(e).subscribe(res => {
      res.forEach(attachment => {
        this.history.push({
          file: undefined,
          fileName: attachment.filename,
          mandatory: true,
          object: {id: attachment.uuid, label: undefined},
          type: attachment.attachmentType,
          uuid: attachment.uuid,
          author: attachment.user.login,
          created: attachment.created
        });
      });
      this.loadHistory = false;
    });
  }

  delete(attachment: Attachment) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '30%',
      data: {
        title: 'Confirmation',
        text: 'Voulez-vous supprimer le fichier ' + attachment.fileName + '?'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.remove.emit(attachment);
      }
    });
  }

  save() {
    const attachment: Attachment = {
      uuid: undefined,
      type: this.selectedFileType,
      fileName: this.currentFileName,
      file: this.currentFile,
      object: this.selectedObject
    };
    this.isLoading = true;
    this.upload.emit(attachment);
  }

  isReadyToUpload() {
    const fileType = this.fileTypes.filter(ft => ft.types.includes(this.selectedFileType));
    const types = fileType.map(ft => ft.types);
    const objects = fileType.map(ft => ft.objects);
    return (types.length === 1 || (this.otherType && this.otherFileType) || (!this.otherType && this.selectedFileType))
      && (objects.length === 1 || this.selectedObject) && this.currentFile;
  }

  downloadFile(attachment: Attachment) {
    if (!attachment) {
      this.openFile(this.currentFile);
    } else {
      this.download.emit(attachment);
    }
  }

  openFile(file: File | Blob) {
    if (file) {
      const data = window.URL.createObjectURL(file);
      window.open(data, '_blank');
    }
  }

  getObjects() {
    const fileType = this.fileTypes.filter(t => t.types.includes(this.selectedFileType))[0];
    this.objectList = fileType ? fileType.objects : [];
    return this.objectList.length > 1;
  }

  changeId(ev: MatSelectChange) {
    const estateTypeId = ev.value;
    this.selectedObject = this.objectList.find((value) => value.id === estateTypeId);
  }

  getName(id: string) {
    const obj = this.objectList.filter((com) => com.id === id)[0];
    return obj ? obj.label : '';
  }

}

export interface Attachment {
  uuid: string;
  type: string;
  fileName: string;
  file: File;
  object: AttachmentObject;
  mandatory?: boolean;
  author?: any;
  created?: Date;
}

export interface AttachmentType {
  types: string[];
  objects: AttachmentObject[];
}

export interface AttachmentObject {
  id: string;
  label: string;
}

export interface AttachmentHistory {
  macroId: string;
  oldFiles: Attachment[];
}

@Directive({
  selector: '[appFileUploadDragDrop]'
})
export class FileUploadDragDropDirective {

  @Output() fileDropped = new EventEmitter<any>();

  @HostBinding('style.border') private border = '5px dashed transparent';
  @HostBinding('style.background-color') private background = 'white';

  // Dragover listener
  @HostListener('dragover', ['$event'])
  public onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.border = '5px dashed #22a8c2';
    this.background = 'aliceblue';
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.border = '5px dashed transparent';
    this.background = 'white';
  }

  // Drop listener
  @HostListener('drop', ['$event'])
  public ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.border = '5px dashed transparent';
    this.background = 'white';
    const files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
  }

}
