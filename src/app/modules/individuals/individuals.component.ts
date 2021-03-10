import {Component, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {AccountStatus, AccountType, AccountWithRole} from '../../services/backend/accounts.service';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {Action, ActionType, ColumnInfo, CustomDatasource, FilterType} from '../../core/datagrid';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {PageEvent} from '@angular/material';
import {IndividualService} from '../../services/backend/individual.service';
import {NewIndividual} from './new-individual';
import {AccountFormData, AccountFormMode} from '../account-form/account-form.component';
import {AccountFormDialogComponent} from '../account-form/account-form-dialog/account-form-dialog.component';
import * as moment from 'moment';
import {Sort} from '../../core/datagrid';

@Component({
  selector: 'app-individuals',
  templateUrl: './individuals.component.html'
})
export class IndividualsComponent {

  @ViewChild('sidePanel') sidePanel: SidePanelComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Particulier');

  action = false;
  dataSourceTable: CustomDatasource<NewIndividual>;
  dataSourceSidePanel: CustomDatasource<NewIndividual>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {name: 'name', title: 'Nom', filterType: FilterType.TEXT, routerLink: () => 'individuals/:id'},
    {name: 'status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status},
    {name: 'category', title: 'Catégorie', filterType: FilterType.SELECT, selectOption: ['Client', 'Fournisseur', 'Partenaire', 'Sous-traitant', 'Autre'], maxWidthPx: 150},
    {name: 'people.phone', title: 'Téléphone', filterType: FilterType.TEXT},
    {name: 'address', title: 'Adresse', filterType: FilterType.TEXT},
    {name: 'commercial.name', title: 'Commercial gestionnaire', filterType: FilterType.TEXT},
  ];

  datagridAction: Action[] = [
    {type: ActionType.PREVIEW, click: (elem) => this.setPreview(elem)}
  ];

  actionData: PlusActionData[] = [
    {
      label: 'Ajouter un particulier',
      icon: 'add',
      function: () => this.createAccount()
    }
  ];

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private service: IndividualService
  ) {
    this.dataSourceTable = new CustomDatasource<NewIndividual>(this.service);
    this.dataSourceSidePanel = new CustomDatasource<NewIndividual>(this.service);
    this.status[AccountStatus.INVALID] = {colorClass: 'warn', value: 'Compte non validé'};
    this.status[AccountStatus.INACTIVE] = {colorClass: 'red', value: 'Compte désactivé'};
    this.status[AccountStatus.VALID] = {colorClass: 'green', value: 'Compte validé'};
  }

  setPreview(elem: NewIndividual) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewIndividual) {
    console.log(elem);
    this.sidePanelContent.element = [];
    this.sidePanelContent.element.push({
      title: 'Établissement',
      content: [
        {label: 'Nom', value: elem.name, routerLink: 'individuals/' + elem.id},
        {label: 'Téléphone', value: elem.people.phone},
        // {label: 'Email', value: elem.account ? elem.account.contact.email : 'Non renseigné'},
        {label: 'Adresse', value: elem.address},
        {label: 'Catégorie', value: elem.category},
        {label: 'Commercial', value: elem.commercial.name},
        {label: 'Date de création', value: moment(parseInt(elem.created, 10)).format('DD/MM/YYYY')}
      ]
    });
  }

  createAccount() {
    const data: AccountFormData = {
      mode: AccountFormMode.CREATE,
      forceType: AccountType.INDIVIDUAL
    };
    const addDialogRef = this.dialog.open(AccountFormDialogComponent, {
      data: data,
      width: '60%'
    });
    addDialogRef.afterClosed().subscribe((resp: AccountWithRole) => {
      if (resp) {
        this.router.navigate(['/individuals/' + resp.account.uuid]);
      }
    });
  }
}
