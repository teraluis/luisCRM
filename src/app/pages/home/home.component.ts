import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {LockService} from '../../services/front/lock.service';
import {NavigationService, MenuStep} from '../../services/front/navigation.service';
import {MatDialog} from '@angular/material';
import {FeedbackDialogComponent} from '../../modules/feedback-dialog/feedback-dialog.component';
import {MatTooltip} from '@angular/material';
import {FeedbackFrontService} from '../../services/front/feedback-front.service';
import {MenuItem, MenuLine, WhiteLine} from './menu/menu.component';
import {ManagementRights} from '../../core/rights/ManagementRights';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild(MatTooltip) myTooltip;

  dialogRef;
  public isExpanded = true;
  userRights: ManagementRights = new ManagementRights();

  constructor(public dialog: MatDialog,
              private changeDetector: ChangeDetectorRef,
              private lockService: LockService,
              private feedbackService: FeedbackFrontService,
              protected router: Router,
              protected navigatonService: NavigationService) {
  }

  menuItems: Array<MenuLine> = [];

  openModal(): void {
    if (this.lockService.lockState === false) {
      this.dialogRef = this.dialog.open(FeedbackDialogComponent, {
        panelClass: 'feedack-dialog-container',
        backdropClass: 'feedback-backdrop',
        width: '350px',
        position: {bottom: '41px', left: '0%'}
      });
    }
  }

  ngOnInit() {
    if (!localStorage.getItem('privileges')) {
      localStorage.clear();
      this.router.navigate(['/login']);
    } else {
      this.buildMenuItems();
      this.isExpanded = window.matchMedia('(min-width: 1500px)').matches;

      this.navigatonService.watch().subscribe((nav) => {
        this.menuItems.filter(item => item.isMenuItem).map(item => item as MenuItem).forEach(item => {
          item.active = item.id === nav.menu;
        });
        this.changeDetector.detectChanges();
      });

      this.lockService.lockSubject.asObservable().subscribe((lock) => {
        if (lock !== null) {
          for (const line of this.menuItems) {
            const menuItem = line as MenuItem;
            menuItem.enable = false;
          }
        } else {
          for (const line of this.menuItems) {
            const menuItem = line as MenuItem;
            menuItem.enable = menuItem.defaultEnable;
          }
        }
      });

      this.feedbackService.feedbackSubject.asObservable().subscribe((state) => {
        if (state === true) {
          this.isExpanded = true;
          this.openModal();
        } else {
          if (this.dialogRef) {
            this.dialogRef.close();
          }
        }
      });
    }
  }

  protected buildMenuItems() {
    this.menuItems = [
      new MenuItem({
        id: MenuStep.DASHBOARD,
        label: 'Tableau de bord',
        icon: 'dashboard_outlined',
        route_to: ['/dashboard'],
        active: false,
        enable: true,
        defaultEnable: true
      }),
      new WhiteLine(),
      new MenuItem({
        id: MenuStep.ORDERS,
        label: 'Commandes',
        icon: 'assignment_turn_in_outline',
        route_to: ['/orders'],
        active: false,
        enable: true,
        defaultEnable: true
      }),
      new MenuItem({
        id: MenuStep.INTERVENTIONS,
        label: 'Interventions',
        icon: 'description_outline',
        route_to: ['/interventions'],
        active: false,
        enable: true,
        defaultEnable: true,
      }),
      new MenuItem({
        id: MenuStep.FACTURATION,
        label: 'Facturation',
        icon: 'credit_card',
        route_to: ['/bills'],
        active: false,
        enable: true,
        defaultEnable: true
      }),
      new WhiteLine(),
      new MenuItem({
        id: MenuStep.ACCOUNTS,
        label: 'Comptes',
        icon: 'people_outline',
        active: false,
        enable: true,
        defaultEnable: true,
        children: [
          new MenuItem({
            id: MenuStep.ACCOUNTS_PRO,
            label: 'Tous',
            icon: 'account_balance',
            route_to: ['/comptes'],
            active: false,
            enable: true,
            defaultEnable: true
          }),
          new MenuItem({
            id: MenuStep.ESTABLISHMENTS,
            label: 'Établissements',
            icon: 'business',
            route_to: ['/establishments'],
            active: false,
            enable: true,
            defaultEnable: true
          }),
          new MenuItem({
            id: MenuStep.INDIVIDUALS,
            label: 'Particuliers',
            icon: 'account_circle',
            route_to: ['/individuals'],
            active: false,
            enable: true,
            defaultEnable: true
          })
        ]
      }),
      new MenuItem({
        id: MenuStep.MARCHES,
        label: 'Marchés',
        icon: 'storefront',
        route_to: ['/market'],
        active: false,
        enable: true,
        defaultEnable: true,
      }),
      new MenuItem({
        id: MenuStep.ESTATES,
        label: 'Biens',
        icon: 'house_outline',
        route_to: ['/estates'],
        active: false,
        enable: true,
        defaultEnable: true
      }),
      new WhiteLine(),
      new MenuItem({
        id: MenuStep.ADMIN,
        label: 'Administration',
        icon: 'settings',
        active: false,
        enable: true,
        defaultEnable: true,
        children: [
          new MenuItem({
            id: MenuStep.EXPORT,
            label: 'Exports',
            icon: 'get_app',
            route_to: ['/management/export'],
            active: false,
            enable: true,
            defaultEnable: true,
          }),
          new MenuItem({
            id: MenuStep.REFERENTIELS,
            label: 'Référentiels',
            icon: 'library_books',
            active: false,
            enable: this.userRights.baseline,
            defaultEnable: true,
            children: [
              new MenuItem({
                id: MenuStep.GROUPES,
                label: 'Groupes',
                icon: 'store',
                route_to: ['/management/referential/groups'],
                active: false,
                enable: true,
                defaultEnable: true,
              }),
              new MenuItem({
                id: MenuStep.ACTIVITES,
                label: 'Activités',
                icon: 'show_chart',
                route_to: ['/management/referential/activity'],
                active: false,
                enable: true,
                defaultEnable: true,
              }),
              new MenuItem({
                id: MenuStep.AGENCES,
                label: 'Agences',
                icon: 'apartment',
                route_to: ['/management/referential/agency'],
                active: false,
                enable: true,
                defaultEnable: true,
              }),
              new MenuItem({
                id: MenuStep.TECHNICAL_ACT,
                label: 'Actes',
                icon: 'engineering',
                route_to: ['/management/referential/technical-act'],
                active: false,
                enable: true,
                defaultEnable: true,
              }),
              new MenuItem({
                id: MenuStep.PRODUITS,
                label: 'Produits',
                icon: 'qr_code',
                route_to: ['/management/referential/produits'],
                active: true,
                enable: true,
                defaultEnable: true,
              }),
            ]
          })
        ]
      }),
      new MenuItem({
        id: MenuStep.EMPTY,
        label: 'Feedback',
        icon: 'chat',
        active: false,
        enable: true,
        defaultEnable: true,
        action: () => this.openModal()
      })
      // new WhiteLine(),
      // new MenuItem({
      //   id: MenuStep.DEVIS,
      //   label: 'Devis',
      //   icon: 'receipt',
      //   route_to: ['/devis'],
      //   active: false,
      //   enable: false,
      //   defaultEnable: false
      // }),
      // new MenuItem({
      //   id: MenuStep.OPERATIONS,
      //   label: 'Opérations',
      //   icon: 'layers',
      //   route_to: ['/marches'],
      //   active: false,
      //   enable: false,
      //   defaultEnable: false
      // }),
    ];
  }
}
