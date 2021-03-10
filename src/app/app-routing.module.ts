import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './pages/login/login.component';
import {AuthGuard} from './services/front/authguard.service';
import {NotfoundComponent} from './pages/notfound/notfound.component';
import {OrderComponent} from './modules/order/order.component';
import {OrdersComponent} from './modules/orders/orders.component';
import {InterventionComponent} from './modules/intervention/intervention.component';
import {InterventionsComponent} from './modules/interventions/interventions.component';
import {DashboardComponent} from './modules/dashboard/dashboard.component';
import {BillsComponent} from './modules/bills/bills.component';
import {AccountsComponent} from './modules/accounts/accounts.component';
import {AccountComponent} from './modules/account/account.component';
import {ManagementComponent} from './modules/management/management.component';
import {GroupsComponent} from './modules/groups/groups.component';
import {ActivitiesComponent} from './modules/activities/activities.component';
import {EstatesComponent} from "./modules/estates/estates.component";
import {EstateComponent} from "./modules/estate/estate.component";
import {AgenciesComponent} from './modules/agencies/agencies.component';
import {TechnicalActsComponent} from './modules/technical-acts/technical-acts.component';
import {MarketsComponent} from './modules/markets/markets.component';
import {MarketComponent} from './modules/market/market.component';
import {EstablishmentsComponent} from "./modules/establishments/establishments.component";
import {IndividualsComponent} from "./modules/individuals/individuals.component";
import {EstablishmentComponent} from "./modules/establishment/establishment.component";
import {IndividualComponent} from "./modules/individual/individual.component";
import {BaselineGuard} from "./services/front/baselineguard.service";
import {ProductsComponent} from "./modules/products/products.component";

const routes: Routes = [
  {
    path: '', component: HomeComponent, canActivate: [AuthGuard], children: [
      {path: '', pathMatch: 'full', redirectTo: '/dashboard'},
      {path: 'dashboard', component: DashboardComponent},
      {
        path: 'interventions', children: [
          {path: '', component: InterventionsComponent},
          {
            path: ':interventionId/orders/:orderId',
            component: InterventionComponent
          }
        ]
      },
      {
        path: 'orders', children: [
          {path: '', component: OrdersComponent},
          {path: 'createorder', component: OrderComponent},
          {path: ':id', component: OrderComponent},
        ]
      },
      {path: 'bills', component: BillsComponent},
      {
        path: 'comptes', children: [
          {path: '', component: AccountsComponent},
          {path: ':id', component: AccountComponent},
        ]
      },
      {
        path: 'establishments', children: [
          {path: '', component: EstablishmentsComponent},
          {path: ':id', component: EstablishmentComponent},
        ]
      },
      {
        path: 'individuals', children: [
          {path: '', component: IndividualsComponent},
          {path: ':id', component: IndividualComponent}
        ]
      },
      {
        path: 'management', children: [
          {path: 'export', component: ManagementComponent},
          {
            path: 'referential', canActivate: [BaselineGuard], children: [
              {path: 'groups', component: GroupsComponent},
              {path: 'activity', component: ActivitiesComponent},
              {path: 'agency', component: AgenciesComponent},
              {path: 'technical-act', component: TechnicalActsComponent},
              {path: 'produits', component: ProductsComponent}
            ]
          }
        ]
      },
      {path: 'market', children:
          [
            {path: '', component: MarketsComponent},
            {path: ':id', component: MarketComponent}
          ]
      },
      {path: 'estates', component: EstatesComponent},
      {path: 'estates/:id', component: EstateComponent},
      {path: 'estates/:estateId/localities/:localityId', component: EstateComponent},
      {path: 'estates/:estateId/premises/:premisesId', component: EstateComponent},
      {path: 'estates/:estateId/annexes/:annexId', component: EstateComponent}
    ]
  },
  {path: 'login', component: LoginComponent},
  {path: 'not-found', component: NotfoundComponent},
  {path: '**', redirectTo: 'not-found', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
