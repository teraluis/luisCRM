import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './pages/home/home.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DateAdapter, MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatDialogModule, MatDialogRef, MatDividerModule, MatExpansionModule, MatGridListModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatNativeDateModule, MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatTableModule, MatTabsModule, MatToolbarModule, MatTooltipModule, MatTreeModule} from '@angular/material';

import {DatePipe, registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {TopbarComponent} from './modules/topbar/topbar.component';
import {LoginComponent} from './pages/login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {AuthGuard} from './services/front/authguard.service';
import {LoginService} from './services/backend/login.service';
import {NotfoundComponent} from './pages/notfound/notfound.component';
import {SearchbarService} from './services/front/searchbar.service';
import {OrganizationsService} from './services/backend/organizations.service';
import {MarketsService} from './services/backend/markets.service';
import {OrdersService} from './services/backend/orders.service';
import {PeopleService} from './services/backend/people.service';
import {PrestationsService} from './services/backend/prestations.service';
import {EstimatesService} from './services/backend/estimates.service';
import {CommercialService} from './services/backend/commercial.service';
import {UtilitiesService} from './services/backend/utilities.service';
import {LocationService} from './services/backend/location.service';
import {OrdersComponent} from './modules/orders/orders.component';
import {OrderDescriptionComponent} from './modules/order/order-description/order-description.component';
import {LockService} from './services/front/lock.service';
import {OrderEstateComponent} from './modules/order/order-estate/order-estate.component';
import {OrderPrestationDialogComponent} from './modules/order/order-prestation-dialog/order-prestation-dialog.component';
import {InterventionReportresultsComponent} from './modules/intervention/intervention-reportresults/intervention-reportresults.component';
import {ResultsService} from './services/backend/results.service';
import {InterventionComponent} from './modules/intervention/intervention.component';
import {NewInterventionComponent} from './modules/intervention/new-intervention.component';
import {InterventionDescriptionComponent} from './modules/intervention/intervention-description/intervention-description.component';
import {InterventionPlanningComponent} from './modules/intervention/intervention-planning/intervention-planning.component';
import {LinesService} from './services/front/lines.service';
import {InterventionsService} from './services/backend/interventions.service';
import {InterventionsComponent} from './modules/interventions/interventions.component';
import {SortService} from './services/front/sort.service';
import {BillsService} from './services/backend/bills.service';
import {BillComponent} from './modules/bill/bill.component';
import {BilllinesComponent} from './modules/billlines/billlines.component';
import {DashboardComponent} from './modules/dashboard/dashboard.component';
import {PieChartComponent} from './modules/pie-chart/pie-chart.component';
import {ChartsModule} from 'ng2-charts';
import {DatefieldComponent} from './modules/datefield/datefield.component';
import {BillsComponent} from './modules/bills/bills.component';
import {OrderCreateDialogComponent} from './modules/order-create-dialog/order-create-dialog.component';
import {AccountFormDialogComponent} from './modules/account-form/account-form-dialog/account-form-dialog.component';
import {ExpertsService} from './services/backend/experts.service';
import {BillModalComponent} from './modules/bill-modal/bill-modal.component';
import {ConfirmationComponent} from './modules/confirmation/confirmation.component';
import {MapComponent} from './modules/map/map.component';
import {ReportService} from './services/backend/report.service';
import {NavigationService} from './services/front/navigation.service';
import {InfoService} from './services/front/info.service';
import {FeedbackDialogComponent} from './modules/feedback-dialog/feedback-dialog.component';
import {SidePanelComponent} from './modules/side-panel/side-panel.component';
import {SidePanelService} from './services/front/sidepanel.service';
import {CustomDateAdapter} from './core/customdateadapter.class';
import {FileUploadComponent, FileUploadDragDropDirective} from './modules/file-upload/file-upload.component';
import {SearchService} from './services/backend/search.service';
import {AccountsComponent} from './modules/accounts/accounts.component';
import {AccountComponent} from './modules/account/account.component';
import {ErrorComponent} from './modules/error/error.component';
import {FeedbackFrontService} from './services/front/feedback-front.service';
import {TableSearchListComponent, TableSearchListDialogComponent} from "./modules/table-search-list/table-search-list.component";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {ManagementComponent} from './modules/management/management.component';
import {BaselineGuard} from './services/front/baselineguard.service';
import {ManagementService} from './services/backend/management.service';
import {MatRadioModule} from "@angular/material/radio";
import {EstablishmentFormComponent} from "./modules/establishment-form/establishment-form.component";
import {AddressFormComponent} from "./modules/address-form/address-form.component";
import {ContactFormDialogComponent} from "./modules/contact-form/contact-form-dialog/contact-form-dialog.component";
import {AccountFormComponent} from "./modules/account-form/account-form.component";
import {MatStepperModule} from "@angular/material/stepper";
import {MatBadgeModule} from "@angular/material/badge";
import {AccountsService} from "./services/backend/accounts.service";
import {EntitiesService} from "./services/backend/entities.service";
import {EstablishmentsService} from "./services/backend/establishments.service";
import {AddressesService} from "./services/backend/addresses.service";
import {MenuComponent} from './pages/home/menu/menu.component';
import {GroupsComponent} from './modules/groups/groups.component';
import {GroupFormDialogComponent} from './modules/group-form/group-form-dialog/group-form-dialog.component';
import {ActivitiesComponent} from './modules/activities/activities.component';
import {ActivityFormDialogComponent} from './modules/activity-form/activity-form-dialog/activity-form-dialog.component';
import {EstateComponent} from "./modules/estate/estate.component";
import {EstatesComponent} from "./modules/estates/estates.component";
import {EstatesService} from "./services/backend/estates.service";
import {AgenciesComponent} from './modules/agencies/agencies.component';
import {AgencyFormComponent} from './modules/agency-form/agency-form.component';
import {TechnicalActsComponent} from './modules/technical-acts/technical-acts.component';
import {TechnicalActFormDialogComponent} from './modules/technical-act-form/technical-act-form-dialog/technical-act-form-dialog.component';
import {MarketsComponent} from './modules/markets/markets.component';
import {MarketCreateComponent} from './modules/market-create/market-create.component';
import {MarketComponent} from './modules/market/market.component';
import {InterventionCommentService} from './services/backend/intervention-comment.service';
import {OrderComponent} from "./modules/order/order.component";
import {OrderInterventionComponent} from "./modules/order/order-intervention/order-intervention.component";
import {UserFormComponent} from './modules/user-form/user-form.component';
import {CommentCreateDialogComponent} from './modules/comment-create-dialog/comment-create-dialog.component';
import {FilterService} from "./services/front/filter.service";
import {AddressFormDialogComponent} from "./modules/address-form/address-form-dialog/address-form-dialog.component";
import {ContactFormComponent} from "./modules/contact-form/contact-form.component";
import {EstablishmentFormDialogComponent} from "./modules/establishment-form/establishment-form-dialog/establishment-form-dialog.component";
import {MarketCreateDialogComponent} from "./modules/market-create/market-create-dialog/market-create-dialog.component";
import {UserFormDialogComponent} from "./modules/user-form/user-form-dialog/user-form-dialog.component";
import {EstateCreateComponent} from "./modules/estate-create/estate-create.component";
import {EstateCreateDialogComponent} from "./modules/estate-create/estate-create-dialog/estate-create-dialog.component";
import {EstateFormAnnexDialogComponent} from "./modules/estate-form-annex/estate-form-annex-dialog/estate-form-annex-dialog.component";
import {EstateFormAnnexComponent} from "./modules/estate-form-annex/estate-form-annex.component";
import {EstateFormPremisesDialogComponent} from "./modules/estate-form-premises/estate-form-premises-dialog/estate-form-premises-dialog.component";
import {EstateFormPremisesComponent} from "./modules/estate-form-premises/estate-form-premises.component";
import {EstateFormLocalityDialogComponent} from "./modules/estate-form-locality/estate-form-locality-dialog/estate-form-locality-dialog.component";
import {EstateFormLocalityComponent} from "./modules/estate-form-locality/estate-form-locality.component";
import {EntityFormComponent} from "./modules/account-form/entity-form/entity-form.component";
import {AgencyFormDialogComponent} from "./modules/agency-form/agency-form-dialog/agency-form-dialog.component";
import {ActivityFormComponent} from "./modules/activity-form/activity-form.component";
import {GroupFormComponent} from "./modules/group-form/group-form.component";
import {TechnicalActFormComponent} from "./modules/technical-act-form/technical-act-form.component";
import {OrderBillComponent} from "./modules/order/order-bill/order-bill.component";
import {SirenValidatorDirective} from "./core/validators/siren-validator.directive";
import {SiretValidatorDirective} from "./core/validators/siret-validator.directive";
import {TelephoneValidatorDirective} from "./core/validators/telephone-validator.directive";
import {IbanValidatorDirective} from "./core/validators/iban-validator.directive";
import {EmailValidatorDirective} from "./core/validators/email-validator.directive";
import {FeedbackService} from "./services/backend/feedback.service";
import {EstablishmentsComponent} from "./modules/establishments/establishments.component";
import {IndividualsComponent} from "./modules/individuals/individuals.component";
import {EstablishmentContactsComponent} from "./modules/establishment/establishment-contacts/establishment-contacts.component";
import {EstablishmentAddressesComponent} from './modules/establishment/establishment-addresses/establishment-addresses.component';
import {EstablishmentDelegatesComponent} from "./modules/establishment/establishment-delegates/establishment-delegates.component";
import {EstablishmentComponent} from "./modules/establishment/establishment.component";
import {IndividualComponent} from "./modules/individual/individual.component";
import {AccountEstablishmentsComponent} from "./modules/account/account-establishments/account-establishments.component";
import {MarketContactsComponent} from "./modules/market/market-contacts/market-contacts.component";
import {MarketUsersComponent} from "./modules/market/market-users/market-users.component";
import {MarketEstablishmentsComponent} from "./modules/market/market-establishments/market-establishments.component";
import {PlusButtonComponent} from './modules/plus-button/plus-button.component';
import {DatagridModule} from './core/datagrid';
import {SidePanelModule} from './core/side-panel/side-panel.module';
import {FrontBillsService} from './services/front/bills.service';
import {EventsComponent} from './modules/events/events.component';
import {FormErrorsHandlerComponent} from "./core/form-errors-handler/form-errors-handler.component";
import {EstateSearchDialogComponent} from "./modules/estate-search-dialog/estate-search-dialog.component";
import {EstateEditDialogComponent} from "./modules/estate-edit/estate-edit-dialog/estate-edit-dialog.component";
import {EstateEditComponent} from "./modules/estate-edit/estate-edit.component";
import {InterventionUpdateDialogComponent} from './modules/intervention/intervention-update-dialog/intervention-update-dialog.component';
import {InterventionScheduleDialogComponent} from './modules/intervention/intervention-schedule-dialog/intervention-schedule-dialog.component';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {InterventionResultsDialogComponent} from './modules/intervention/intervention-results-dialog/intervention-results-dialog.component';
import {MatSelectAutocompleteModule} from './core/mat-select-autocomplete/mat-select-autocomplete.module';
import { DomEventPipe } from './pipes/dom-event.pipe';
import {EstateOrdersComponent} from "./modules/estate/estate-orders/estate-orders.component";
import {EstateInterventionsComponent} from "./modules/estate/estate-interventions/estate-interventions.component";
import { ProductsComponent } from './modules/products/products.component';
import { ProductsFormComponent } from './modules/products-form/products-form.component';
import { ProductsFormDialogComponent } from './modules/products-form/products-form-dialog/products-form-dialog.component';
import { ProductTypeFormComponent } from './modules/product-type-form/product-type-form.component';
import { SurfaceTypeFormComponent } from './modules/surface-type-form/surface-type-form.component';
import {AnalyseTypeService} from './services/backend/analyse-type.service';
import {EstablishmentEstatesComponent} from "./modules/establishment/establishment-estates/establishment-estates.component";
import {IndividualEstatesComponent} from "./modules/individual/individual-estates/individual-estates.component";
import {AccountEstatesComponent} from "./modules/account/account-estates/account-estates.component";
import {EstablishmentOrdersComponent} from "./modules/establishment/establishment-orders/establishment-orders.component";
import { AccountOrdersComponent } from './modules/account/account-orders/account-orders.component';
import { IndividualOrdersComponent } from './modules/individual/individual-orders/individual-orders.component';
import {ReportDestinationFormComponent} from "./modules/report-destination-form/report-destination-form.component";
import {ReportDestinationFormDialogComponent} from "./modules/report-destination-form/report-destination-form-dialog/report-destination-form-dialog.component";
import {SatDatepickerModule} from 'saturn-datepicker';
import {EstablishmentMarketsComponent} from "./modules/establishment/establishment-markets/establishment-markets.component";
import {InterventionEstateComponent} from "./modules/intervention/intervention-estate/intervention-estate.component";


registerLocaleData(localeFr, 'fr');

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TopbarComponent,
    LoginComponent,
    NotfoundComponent,
    OrderComponent,
    OrderDescriptionComponent,
    OrderEstateComponent,
    OrdersComponent,
    OrderPrestationDialogComponent,
    OrderBillComponent,
    InterventionReportresultsComponent,
    InterventionComponent,
    NewInterventionComponent,
    InterventionDescriptionComponent,
    InterventionPlanningComponent,
    InterventionsComponent,
    BillComponent,
    BilllinesComponent,
    DashboardComponent,
    DashboardComponent,
    PieChartComponent,
    DatefieldComponent,
    BillsComponent,
    OrderCreateDialogComponent,
    OrderInterventionComponent,
    AccountsComponent,
    AccountComponent,
    AccountFormComponent,
    IndividualsComponent,
    IndividualComponent,
    EntityFormComponent,
    AccountFormDialogComponent,
    AccountEstablishmentsComponent,
    EstablishmentsComponent,
    EstablishmentFormComponent,
    EstablishmentFormDialogComponent,
    EstablishmentComponent,
    EstablishmentContactsComponent,
    EstablishmentAddressesComponent,
    EstablishmentDelegatesComponent,
    ContactFormDialogComponent,
    ContactFormComponent,
    AddressFormComponent,
    AddressFormDialogComponent,
    BillModalComponent,
    ConfirmationComponent,
    MapComponent,
    FeedbackDialogComponent,
    SidePanelComponent,
    FileUploadComponent,
    FileUploadDragDropDirective,
    TableSearchListComponent,
    TableSearchListDialogComponent,
    ErrorComponent,
    ManagementComponent,
    MenuComponent,
    GroupsComponent,
    GroupFormComponent,
    GroupFormDialogComponent,
    ActivitiesComponent,
    ActivityFormComponent,
    ActivityFormDialogComponent,
    AgenciesComponent,
    AgencyFormComponent,
    AgencyFormDialogComponent,
    EstateComponent,
    EstatesComponent,
    EstateCreateComponent,
    EstateCreateDialogComponent,
    EstateSearchDialogComponent,
    EstateEditComponent,
    EstateEditDialogComponent,
    EstateFormAnnexComponent,
    EstateFormAnnexDialogComponent,
    EstateFormPremisesComponent,
    EstateFormPremisesDialogComponent,
    EstateFormLocalityComponent,
    EstateFormLocalityDialogComponent,
    SirenValidatorDirective,
    EmailValidatorDirective,
    TelephoneValidatorDirective,
    SiretValidatorDirective,
    IbanValidatorDirective,
    TechnicalActsComponent,
    TechnicalActFormComponent,
    TechnicalActFormDialogComponent,
    MarketsComponent,
    MarketCreateComponent,
    MarketCreateDialogComponent,
    MarketComponent,
    MarketContactsComponent,
    MarketEstablishmentsComponent,
    MarketUsersComponent,
    UserFormComponent,
    UserFormDialogComponent,
    CommentCreateDialogComponent,
    PlusButtonComponent,
    EventsComponent,
    FormErrorsHandlerComponent,
    InterventionUpdateDialogComponent,
    InterventionScheduleDialogComponent,
    InterventionResultsDialogComponent,
    DomEventPipe,
    ProductsComponent,
    ProductsFormComponent,
    ProductsFormDialogComponent,
    EstateOrdersComponent,
    EstateInterventionsComponent,
    ProductTypeFormComponent,
    SurfaceTypeFormComponent,
    EstablishmentEstatesComponent,
    IndividualEstatesComponent,
    AccountEstatesComponent,
    EstablishmentOrdersComponent,
    AccountOrdersComponent,
    IndividualOrdersComponent,
    ReportDestinationFormComponent,
    ReportDestinationFormDialogComponent,
    EstablishmentMarketsComponent,
    InterventionEstateComponent
  ],
  entryComponents: [
    InterventionDescriptionComponent,
    InterventionPlanningComponent,
    InterventionReportresultsComponent,
    OrderCreateDialogComponent,
    OrderPrestationDialogComponent,
    BillModalComponent,
    ConfirmationComponent,
    FeedbackDialogComponent,
    ErrorComponent,
    TableSearchListDialogComponent,
    AccountFormDialogComponent,
    EstablishmentFormComponent,
    EstablishmentFormDialogComponent,
    ContactFormDialogComponent,
    AddressFormDialogComponent,
    GroupFormDialogComponent,
    ActivityFormDialogComponent,
    AgencyFormDialogComponent,
    EstateCreateDialogComponent,
    EstateSearchDialogComponent,
    EstateEditDialogComponent,
    EstateFormAnnexDialogComponent,
    EstateFormPremisesDialogComponent,
    EstateFormLocalityDialogComponent,
    TechnicalActFormDialogComponent,
    MarketCreateDialogComponent,
    UserFormDialogComponent,
    CommentCreateDialogComponent,
    InterventionUpdateDialogComponent,
    InterventionScheduleDialogComponent,
    InterventionResultsDialogComponent,
    ProductsFormDialogComponent,
    ReportDestinationFormDialogComponent
  ],
    imports: [
        BrowserModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
            defaultLanguage: 'fr'
        }),
        ChartsModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        MatTabsModule,
        MatSidenavModule,
        MatExpansionModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatButtonToggleModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatToolbarModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatChipsModule,
        MatCardModule,
        MatDividerModule,
        MatListModule,
        MatDialogModule,
        MatAutocompleteModule,
        MatTreeModule,
        MatSortModule,
        MatSidenavModule,
        MatGridListModule,
        MatSnackBarModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        DragDropModule,
        MatRadioModule,
        MatStepperModule,
        MatBadgeModule,
        DatagridModule,
        SidePanelModule,
        NgxMaterialTimepickerModule,
        MatSelectAutocompleteModule,
        SatDatepickerModule
    ],
  providers: [
    AuthGuard,
    LoginService,
    SearchbarService,
    MarketsService,
    OrganizationsService,
    OrdersService,
    PeopleService,
    EstimatesService,
    PrestationsService,
    InterventionsService,
    CommercialService,
    UtilitiesService,
    EstatesService,
    NavigationService,
    DatePipe,
    LockService,
    LinesService,
    ResultsService,
    SortService,
    BillsService,
    ExpertsService,
    ReportService,
    InfoService,
    LocationService,
    FeedbackService,
    FeedbackFrontService,
    SidePanelService,
    SearchService,
    AccountsService,
    EntitiesService,
    EstablishmentsService,
    AddressesService,
    InterventionCommentService,
    FilterService,
    {
      provide: MatDialogRef,
      useValue: {}
    },
    {provide: DateAdapter, useClass: CustomDateAdapter},
    BaselineGuard,
    ManagementService,
    FrontBillsService,
    AnalyseTypeService
  ],
  exports: [
    ChartsModule
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(private dateAdapter: DateAdapter<Date>) {
    this.dateAdapter.setLocale('fr-FR');
  }
}
