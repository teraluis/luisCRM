import {Component, OnInit, ViewChild} from '@angular/core';
import {NavigationService} from '../../services/front/navigation.service';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {EstablishmentsService, EstablishmentWithRole} from '../../services/backend/establishments.service';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {Action, ActionType, ColumnInfo, CustomDatasource, FilterType, Sort} from '../../core/datagrid';
import {PageEvent} from '@angular/material';
import {NewEstablishment} from './new-establishment';
import {EstablishmentFormData, EstablishmentFormMode} from '../establishment-form/establishment-form.component';
import {EstablishmentFormDialogComponent} from '../establishment-form/establishment-form-dialog/establishment-form-dialog.component';
import {AccountStatus} from '../../services/backend/accounts.service';

@Component({
  selector: 'app-establishments',
  templateUrl: './establishments.component.html'
})
export class EstablishmentsComponent implements OnInit {

  @ViewChild('sidePanel') sidePanel: SidePanelComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Établissement');

  action = false;
  dataSourceTable: CustomDatasource<NewEstablishment>;
  dataSourceSidePanel: CustomDatasource<NewEstablishment>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {name: 'name', title: 'Nom', filterType: FilterType.TEXT, routerLink: () => 'establishments/:id'},
    {name: 'account.status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status},
    {name: 'account.category', title: 'Catégorie', filterType: FilterType.SELECT, selectOption: ['Client', 'Fournisseur', 'Partenaire', 'Sous-traitant', 'Autre']},
    {name: 'siret', title: 'Siret', filterType: FilterType.TEXT},
    {name: 'address', title: 'Adresse', filterType: FilterType.TEXT},
    {name: 'description', title: 'Description', filterType: FilterType.TEXT},
    {name: 'activity', title: 'Activité', filterType: FilterType.TEXT}
  ];

  datagridAction: Action[] = [
    {type: ActionType.PREVIEW, click: (elem) => this.setPreview(elem)}
  ];

  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un établissement',
      icon: 'add',
      function: () => this.createEstablishment()
    }
  ];

  constructor(private navigationService: NavigationService,
              private router: Router,
              private establishmentsService: EstablishmentsService,
              protected dialog: MatDialog) {
    this.status[AccountStatus.INVALID] = {colorClass: 'warn', value: 'Compte non validé'};
    this.status[AccountStatus.INACTIVE] = {colorClass: 'red', value: 'Compte désactivé'};
    this.status[AccountStatus.VALID] = {colorClass: 'green', value: 'Compte validé'};
  }

  ngOnInit() {
    this.dataSourceTable = new CustomDatasource<NewEstablishment>(this.establishmentsService);
    this.dataSourceSidePanel = new CustomDatasource<NewEstablishment>(this.establishmentsService);
  }

  setPreview(elem: NewEstablishment) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewEstablishment) {
    this.sidePanelContent.element = [];
    this.sidePanelContent.element.push({
      title: 'Établissement',
      content: [
        {label: 'Nom', value: elem.name, routerLink: 'establishments/' + elem.id},
        {label: 'Siret', value: elem.siret},
        {label: 'Adresse', value: elem.address},
        {label: 'Activité', value: elem.activity},
        {label: 'Description', value: elem.description}
      ]
    });
  }

  createEstablishment() {
    const data: EstablishmentFormData = {
      mode: EstablishmentFormMode.CREATE
    };
    const addDialogRef = this.dialog.open(EstablishmentFormDialogComponent, {
      data: data,
      width: '60%'
    });
    addDialogRef.afterClosed().subscribe((resp: EstablishmentWithRole) => {
      if (resp) {
        this.router.navigate(['/establishments/' + resp.establishment.uuid]);
      }
    });
  }
}
