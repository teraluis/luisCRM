import {Component, EventEmitter, OnInit} from '@angular/core';
import {
  ActionEvent,
  ActionType,
  ColumnInformation,
  DeletableTableLine,
  FilterType,
  TableOption,
  TableSearchListInterface
} from '../table-search-list/table-search-list.component';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ActivityService, IActivity} from '../../services/backend/activity.service';
import {ActivityFormDialogComponent} from '../activity-form/activity-form-dialog/activity-form-dialog.component';
import {ActivityFormData, ActivityFormMode} from "../activity-form/activity-form.component";
import {PlusActionData} from "../plus-button/plus-button.component";

@Component({
  selector: 'app-activities-component',
  templateUrl: './activities.component.html'
})
export class ActivitiesComponent implements OnInit, TableSearchListInterface {

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['name', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;

  private activities: IActivity[] = [];
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter une activité',
      icon: 'add',
      function: () => this.createActivity()
    }
  ];

  constructor(private navigationService: NavigationService, private router: Router, protected activityService: ActivityService, protected dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.navigationService.set({menu: MenuStep.ACTIVITES, url: this.router.url});
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.activityService.getAll().subscribe((activities) => {
      this.activities = activities;
      const dataSource = new MatTableDataSource<ActivityTableLine>(this.buildActivityTableLine(activities));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildActivityTableLine(activities: IActivity[]) {
    let i = 1;
    return activities.map(activity => {
      const data: ActivityTableLine = {
        position: i,
        deletable: false,
        id: activity.uuid,
        name: activity.name,
        description: activity.description
      };
      i++;
      return data;
    });
  }

  createActivity(activity?: IActivity) {
    const data: ActivityFormData = {
      mode: !activity ? ActivityFormMode.CREATE : ActivityFormMode.EDIT,
      defaultData: activity
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(ActivityFormDialogComponent, {
      data: data,
      width: '40%'
    });

    addDialogRef.afterClosed().subscribe((resp: IActivity) => {
      if (resp) {
        this.setPageData(0);
      }
    });
  }

  onLineClick(evt: ActionEvent) {
    if (evt.action === ActionType.EDIT) {
      const activity: ActivityTableLine = evt.event;
      this.createActivity(this.activities.find(a => a.uuid === activity.id));
    } else if (evt.action === ActionType.DELETE) {
      // TODO
    }
  }
}

export interface ActivityTableLine extends DeletableTableLine {
  name: string;
  description?: string;
}
