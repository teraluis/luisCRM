import {Component, ViewChild} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {
  Action,
  ActionType,
  ColumnInfo,
  CustomDatasource,
  DatagridComponent,
  FilterType,
  Sort
} from '../../core/datagrid';
import {NewAccount} from './new-account';
import {AccountsService, AccountStatus, AccountType, AccountWithRole} from '../../services/backend/accounts.service';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {Address} from '../../services/backend/addresses.service';
import {PageEvent} from '@angular/material';
import {PeopleAddressRole} from '../../services/backend/people.service';
import {AddressUtils} from '../utils/address-utils';
import {AccountFormDialogComponent} from '../account-form/account-form-dialog/account-form-dialog.component';
import {AccountFormData, AccountFormMode} from '../account-form/account-form.component';
import {PlusActionData} from '../plus-button/plus-button.component';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {ConfirmationComponent} from '../confirmation/confirmation.component';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent {
  @ViewChild('sidePanel') sidePanel: SidePanelComponent;
  @ViewChild('datagrid') dataGrid: DatagridComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Compte');

  action = false;
  dataSourceTable: CustomDatasource<NewAccount>;
  dataSourceSidePanel: CustomDatasource<NewAccount>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {
      name: 'name',
      title: 'Compte',
      filterType: FilterType.TEXT,
      routerLink: (elem) => elem.accountType === 'Professionnel' ? 'comptes/:id' : 'individuals/:id'
    },
    {name: 'status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status},
    {
      name: 'category',
      title: 'Catégorie',
      filterType: FilterType.SELECT,
      selectOption: ['Client', 'Fournisseur', 'Partenaire', 'Sous-traitant', 'Autre'],
      maxWidthPx: 150
    },
    {
      name: 'accountType',
      title: 'Type',
      filterType: FilterType.SELECT,
      selectOption: ['Particulier', 'Professionnel'],
      maxWidthPx: 100
    },
    {name: 'address', title: 'Adresse', filterType: FilterType.TEXT},
    {name: 'commercial.name', title: 'Commercial gestionnaire', filterType: FilterType.TEXT},
    {name: 'entity.siren', title: 'SIREN', filterType: FilterType.TEXT},
  ];

  datagridAction: Action[] = [
    {type: ActionType.PREVIEW, click: (elem) => this.setPreview(elem)}
  ];

  actionData: PlusActionData[] = [{
    label: 'Ajouter un compte',
    icon: 'add',
    function: () => this.createAccount()
  }];

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private service: AccountsService
  ) {
    this.dataSourceTable = new CustomDatasource<NewAccount>(this.service);
    this.dataSourceSidePanel = new CustomDatasource<NewAccount>(this.service);
    this.status[AccountStatus.INVALID] = {colorClass: 'warn', value: 'Compte non validé'};
    this.status[AccountStatus.INACTIVE] = {colorClass: 'red', value: 'Compte désactivé'};
    this.status[AccountStatus.VALID] = {colorClass: 'green', value: 'Compte validé'};
    if (this.userRights.financialManagemement) {
      this.datagridAction.push({
        type: ActionType.DELETE, click: (elem) => {
          const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
            data: {title: 'Confirmation', text: `Êtes-vous sur de vouloir supprimer le compte "${elem.name}" ?`},
            width: '40%'
          });
          deleteDialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.service.delete(elem.id).subscribe(done => {
                this.dataGrid.loadPage();
              });
            }
          });
        }
      });
    }
  }

  setPreview(elem: NewAccount) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewAccount) {
    this.sidePanelContent.element = [];
    this.sidePanelContent.element.push({
      title: 'Compte',
      content: [
        {label: 'Type', value: elem.category + ' - ' + elem.type},
        {label: 'Nom', value: elem.name, routerLink: 'comptes/' + elem.id},
        {label: 'Commercial', value: elem.commercial}
      ]
    });

    if (elem.type !== AccountType.PROFESSIONAL) {
      return;
    }

    this.sidePanelContent.element.push(
      {title: 'Personne morale', isLoading: true},
      {title: 'Contact principal', isLoading: true}
    );

    this.service.getOne(elem.id).subscribe((account) => {
      if (!account) {
        console.log('An error occurred while retrieving ', elem.id);
        this.sidePanelContent.getElement('Personne morale').isLoading = false;
      } else {
        this.sidePanelContent.getElement('Personne morale').content = [
          {label: 'Nom', value: account.entity.name},
          {label: 'Raison sociale', value: account.entity.corporateName},
          {label: 'Siren', value: account.entity.siren}
        ];
        if (account.entity.type) {
          this.sidePanelContent.getElement('Personne morale').content
            .push({label: 'Type', value: account.entity.type});
        }
        if (account.entity.domain) {
          this.sidePanelContent.getElement('Personne morale').content
            .push({label: 'Domaine', value: account.entity.domain});
        }
        if (account.entity.mainAddress) {
          this.sidePanelContent.getElement('Personne morale').content
            .push({label: 'Adresse principale', value: this.getAddressName(account.entity.mainAddress)});
        }
        this.sidePanelContent.getElement('Personne morale').isLoading = false;

        this.sidePanelContent.getElement('Contact principal').content = [
          {
            label: 'Nom',
            value: account.contact.title + ' ' + account.contact.lastname + ' ' + account.contact.firstname
          }
        ];
        if (account.contact.jobDescription) {
          this.sidePanelContent.getElement('Contact principal').content
            .push({label: 'Fonction', value: account.contact.jobDescription});
        }
        this.sidePanelContent.getElement('Contact principal').content
          .push({label: 'Téléphone', value: account.contact.mobilePhone});
        if (account.contact.email) {
          this.sidePanelContent.getElement('Contact principal').content
            .push({label: 'E-mail', value: account.contact.email});
        }

        if (account.contact.addresses.length > 0) {
          account.contact.addresses.forEach(address => {
            this.sidePanelContent.getElement('Contact principal').content
              .push({label: PeopleAddressRole[address.role], value: AddressUtils.getFullName(address.address)});
          });
        }
        this.sidePanelContent.getElement('Contact principal').isLoading = false;
      }
    });
  }

  createAccount() {
    const data: AccountFormData = {
      mode: AccountFormMode.CREATE
    };
    const addDialogRef = this.dialog.open(AccountFormDialogComponent, {
      data: data,
      width: '60%'
    });
    addDialogRef.afterClosed().subscribe((newAccount: AccountWithRole) => {
      if (newAccount) {
        if (newAccount.account.entity) {
          this.router.navigate(['/comptes/' + newAccount.account.uuid]);
        } else {
          this.router.navigate(['/individuals/' + newAccount.account.uuid]);
        }
      }
    });
  }

  getAddressName(address: Address) {
    return AddressUtils.getFullName(address);
  }
}
