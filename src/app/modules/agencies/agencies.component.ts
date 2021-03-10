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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {AgencyService, IAgency} from '../../services/backend/agency.service';
import {AgencyFormData, AgencyFormMode} from '../agency-form/agency-form.component';
import {map} from 'rxjs/operators';
import {AgencyFormDialogComponent} from "../agency-form/agency-form-dialog/agency-form-dialog.component";
import {User} from "../../services/backend/users.service";
import {PlusActionData} from "../plus-button/plus-button.component";

@Component({
  selector: 'app-agency-component',
  templateUrl: './agencies.component.html'
})
export class AgenciesComponent implements OnInit, TableSearchListInterface {

  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['code', 'name', 'manager', 'referenceIban', 'referenceBic'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {
      name: this.displayedColumns[0],
      title: 'Code de l\'agence',
      filterType: FilterType.TEXT,
      filterDisabled: false
    },
    {
      name: this.displayedColumns[1],
      title: 'Nom de l\'agence',
      filterType: FilterType.TEXT,
      filterDisabled: false
    },
    {name: this.displayedColumns[2], title: 'Responsable', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'IBAN de reference', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'BIC de reference', filterType: FilterType.TEXT, filterDisabled: false}
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;

  private agencies: IAgency[] = [];
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter une agence',
      icon: 'add',
      function: () => this.createAgency()
    }
  ];

  constructor(
    private navigationService: NavigationService,
    private router: Router,
    protected agencyService: AgencyService,
    protected dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.navigationService.set({menu: MenuStep.ACTIVITES, url: this.router.url});
  }

  setPageData(page: number) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.agencyService.getAll().pipe(map((agencies: IAgency[]) => {
        return agencies.map(agency => {
          agency.manager = User.fromData(agency.manager);
          return agency;
        });
      }
    )).subscribe((agencies: IAgency[]) => {
      this.agencies = agencies;
      const dataSource = new MatTableDataSource<AgencyTableLine>(this.buildActivityTableLine(agencies));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildActivityTableLine(agencies: IAgency[]) {
    let i = 1;
    return agencies.map((agency: IAgency) => {
      const data: AgencyTableLine = {
        position: i,
        deletable: false,
        id: agency.uuid,
        code: agency.code,
        name: agency.name,
        referenceIban: agency.referenceIban,
        referenceBic: agency.referenceBic,
        manager: agency.manager.toString()
      };
      i++;
      return data;
    });
  }

  createAgency(agency?: IAgency) {
    const data: AgencyFormData = {
      mode: !agency ? AgencyFormMode.CREATE : AgencyFormMode.EDIT,
      defaultData: agency
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(AgencyFormDialogComponent, {
      data: data,
      width: '40%'
    });

    addDialogRef.afterClosed().subscribe((resp) => {
      if (resp) {
        this.setPageData(0);
      }
    });
  }

  onLineClick(evt: ActionEvent) {
    const agency: AgencyTableLine = evt.event;
    if (evt.action === ActionType.EDIT) {
      this.createAgency(this.agencies.find(a => a.uuid === agency.id));
    } else if (evt.action === ActionType.DELETE) {
      // TODO
    }
  }
}

export interface AgencyTableLine extends DeletableTableLine {
  code: string;
  name: string;
  manager: string;
  referenceIban: string;
  referenceBic: string;
}
