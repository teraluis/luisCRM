import {Component, EventEmitter, OnInit} from '@angular/core';
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption
} from '../table-search-list/table-search-list.component';
import {MenuStep, NavigationService} from '../../services/front/navigation.service';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {ITechnicalAct, TechnicalActService} from '../../services/backend/technical-act.service';
import {TechnicalActFormDialogComponent} from '../technical-act-form/technical-act-form-dialog/technical-act-form-dialog.component';
import {ConfirmationComponent} from '../confirmation/confirmation.component';
import {switchMap} from 'rxjs/operators';
import {of} from 'rxjs';
import {TechnicalActFormData, TechnicalActFormMode} from "../technical-act-form/technical-act-form.component";
import {PlusActionData} from "../plus-button/plus-button.component";

@Component({
  selector: 'app-technical-act',
  templateUrl: './technical-acts.component.html'
})
export class TechnicalActsComponent implements OnInit {
// Datagrid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['name', 'shortcut', 'typeTVA', 'codeTVA', 'schedulerId', 'hasAnalyse'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Nom', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Raccourci', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Type TVA (%)', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Code TVA', filterType: FilterType.CHECK, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'ID Géoconcept', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Contient des analyses', filterType: FilterType.BOOLEAN, filterDisabled: false},
  ];
  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;

  private technicalActs: ITechnicalAct[] = [];
  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un acte technique',
      icon: 'add',
      function: () => this.createTechnicalAct()
    }
  ];

  constructor(
    private navigationService: NavigationService,
    private router: Router,
    private technicalActService: TechnicalActService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.navigationService.set({menu: MenuStep.TECHNICAL_ACT, url: this.router.url});
  }

  setPageData(page = 0) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.technicalActService.getAll().subscribe((technicalActs) => {
      this.technicalActs = technicalActs;
      const dataSource = new MatTableDataSource<TechnicalActTableLine>(this.buildTechnicalActTableLine(technicalActs));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildTechnicalActTableLine(technicalActs: any) {
    return technicalActs.map((technicalAct, i) => {
      const data: TechnicalActTableLine = {
        position: i + 1,
        deletable: false,
        id: technicalAct.uuid,
        name: technicalAct.name,
        shortcut: technicalAct.shortcut,
        typeTVA: technicalAct.typeTVA,
        codeTVA: technicalAct.codeTVA,
        schedulerId: technicalAct.schedulerId,
        hasAnalyse: technicalAct.hasAnalyse,
        surfaceType: technicalAct.surfaceType,
        productType: technicalAct.productType,
        offerCode: technicalAct.offerCode,
        comment: technicalAct.comment,
        businessCode: technicalAct.businessCode,
        jobRank: technicalAct.jobRank,
        jobExpertise: technicalAct.jobExpertise,
        description: technicalAct.description,
        active: technicalAct.active,
        web: technicalAct.web
      };
      return data;
    });
  }

  createTechnicalAct(technicalAct?: ITechnicalAct) {
    const data: TechnicalActFormData = {
      mode: !technicalAct ? TechnicalActFormMode.CREATE : TechnicalActFormMode.EDIT,
      defaultData: technicalAct
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(TechnicalActFormDialogComponent, {
      data: data,
      width: '50%',
      height: 'auto'
    });

    addDialogRef.afterClosed().subscribe((resp) => {
      if (resp) {
        this.setPageData(0);
      }
    });
  }

  onLineClick(evt: ActionEvent) {
    const technicalAct: TechnicalActTableLine = evt.event;
    if (evt.action === ActionType.EDIT) {
      this.createTechnicalAct(this.technicalActs.find(a => a.uuid === technicalAct.id));
    } else if (evt.action === ActionType.DELETE) {
      const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
        data: {title: 'Confirmation de suppression', text: 'Êtes-vous sur de vouloir supprimer cet élément ?'},
        width: '40%'
      });

      deleteDialogRef
        .afterClosed()
        .pipe(switchMap(reason => reason ? this.technicalActService.delete(technicalAct.id) : of(null)))
        .subscribe((res) => res ? this.setPageData(0) : null);
    }
  }

  getComboList = () => {
    return {
      typeTVA: ['0', '10', '20'],
      codeTVA: ['2200 - Collectée encaissements exonéré de TVA', '2202 - Collectée encaissements interméd. réduit', '2201 - Collectée encaissements taux normal']
    };
  };
}

export interface TechnicalActTableLine extends DeletableTableLine {
  name: string;
  shortcut: string;
  typeTVA: string;
  codeTVA: string;
  schedulerId: string;
  hasAnalyse: boolean;
  surfaceType: string;
  productType: string;
  offerCode: string;
  comment: string;
  businessCode: string;
  jobRank: string;
  jobExpertise: string;
  description: string;
  active: boolean;
  web: boolean;
}
