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
import {GroupCategory, GroupService, GroupType, IGroup} from '../../services/backend/group.service';
import {GroupFormDialogComponent} from '../group-form/group-form-dialog/group-form-dialog.component';
import {GroupFormData, GroupFormMode} from "../group-form/group-form.component";
import {PlusActionData} from "../plus-button/plus-button.component";

@Component({
  selector: 'app-groups-component',
  templateUrl: './groups.component.html'
})
export class GroupsComponent implements OnInit, TableSearchListInterface {

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['name', 'type', 'category', 'iban', 'description'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Type', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Category', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'IBAN de référence', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un groupe',
      icon: 'save_alt',
      function: () => this.createGroup()
    }
  ];

  private groups: IGroup[] = [];

  constructor(private navigationService: NavigationService, private router: Router, protected groupService: GroupService, protected dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.navigationService.set({menu: MenuStep.GROUPES, url: this.router.url});
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.groupService.getAll().subscribe((groups) => {
      this.groups = groups;
      const dataSource = new MatTableDataSource<GroupTableLine>(this.buildGroupTableLine(groups));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildGroupTableLine(groups: any) {
    let i = 1;
    return groups.map(group => {
      const data: GroupTableLine = {
        position: i,
        deletable: false,
        id: group.uuid,
        name: group.name,
        type: group.type,
        category: group.category,
        iban: group.iban,
        description: group.description
      };
      i++;
      return data;
    });
  }

  createGroup(group?: IGroup) {
    const data: GroupFormData = {
      mode: !group ? GroupFormMode.CREATE : GroupFormMode.EDIT,
      defaultData: group
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(GroupFormDialogComponent, {
      data: data,
      width: '40%'
    });

    addDialogRef.afterClosed().subscribe((resp: IGroup) => {
      if (resp) {
        this.setPageData(0);
      }
    });
  }

  onLineClick(evt: ActionEvent) {
    if (evt.action === ActionType.EDIT) {
      const group: GroupTableLine = evt.event;
      this.createGroup(this.groups.find(a => a.uuid === group.id));
    } else if (evt.action === ActionType.DELETE) {
      // TODO
    }
  }

  getComboList = () => {
    return {type: Object.values(GroupType), category: Object.values(GroupCategory)};
  }
}

export interface GroupTableLine extends DeletableTableLine {
  name: string;
  type: GroupType;
  category?: GroupCategory;
  iban?: string;
  description?: string;
}
