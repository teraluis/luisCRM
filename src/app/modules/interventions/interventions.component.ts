import {Component, ViewChild} from '@angular/core';
import {ManagementRights} from '../../core/rights/ManagementRights';
import {SidePanelComponent, SidePanelContent} from '../../core/side-panel';
import {
  Action,
  ActionType,
  ColumnInfo,
  CustomDatasource,
  FilterType,
  GlobalAction,
  GlobalActionType,
  Sort
} from '../../core/datagrid';
import {NewAccount} from '../accounts/new-account';
import {PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {InterventionsService} from '../../services/backend/interventions.service';
import {InterventionStatus, NewIntervention} from './new-intervention';
import * as moment from 'moment';
import {Analyse, Prestation, PrestationsService} from '../../services/backend/prestations.service';
import {Order, OrdersService} from '../../services/backend/orders.service';
import {forkJoin} from 'rxjs';
import {TechnicalAct, TechnicalActService} from '../../services/backend/technical-act.service';
import {Estate, EstatesService, Premises} from '../../services/backend/estates.service';
import {map, mergeMap} from 'rxjs/operators';
import {Address} from '../../services/backend/addresses.service';
import {EstateUtils} from '../utils/estate-utils';
import {AccountUtils} from '../utils/account-utils';

@Component({
  selector: 'app-interventions',
  templateUrl: './interventions.component.html',
  styleUrls: ['./interventions.component.scss']
})
export class InterventionsComponent {
  @ViewChild('sidePanel') sidePanel: SidePanelComponent;

  sidePanelContent: SidePanelContent = new SidePanelContent('Compte');

  action = false;
  dataSourceTable: CustomDatasource<NewIntervention>;
  dataSourceSidePanel: CustomDatasource<NewIntervention>;
  status = {};
  filter: any = {};
  pagination: PageEvent = new PageEvent();
  sort: Sort = new Sort();
  userRights: ManagementRights = new ManagementRights();
  columnsInfos: ColumnInfo[] = [
    {name: 'name', title: 'N° Intervention', filterType: FilterType.TEXT, routerLink: () => 'interventions/:id/orders/:order.id'},
    {name: 'status', title: 'Statut', filterType: FilterType.STATUS, enumString: this.status},
    {name: 'interventionDate', title: 'Date intervention', filterType: FilterType.DATE},
    {name: 'account.name', title: 'Compte', filterType: FilterType.TEXT, routerLink: () => 'establishments/:account.id'},
    {name: 'order.name', title: 'Commande', filterType: FilterType.TEXT, routerLink: () => 'orders/:order.id'},
    {name: 'prestations', title: 'Prestation', filterType: FilterType.TEXT},
    {name: 'address', title: 'Adresse', filterType: FilterType.TEXT},
  ];

  datagridAction: Action[] = [
    {type: ActionType.PREVIEW, click: (elem) => this.setPreview(elem)}
  ];

  datagridGlobalAction: GlobalAction[] = [
    {type: GlobalActionType.EXPORT}
  ];

  private technicalActs: TechnicalAct[] = [];

  constructor(
    private router: Router,
    private service: InterventionsService,
    private prestationService: PrestationsService,
    private orderService: OrdersService,
    private technicalActService: TechnicalActService,
    private estateService: EstatesService
  ) {
    this.dataSourceTable = new CustomDatasource<NewIntervention>(this.service);
    this.dataSourceSidePanel = new CustomDatasource<NewIntervention>(this.service);
    this.status[InterventionStatus.DRAFT] = {colorClass: 'warn', value: 'Brouillon'};
    this.status[InterventionStatus.CREATED] = {colorClass: 'warn', value: 'Créée'};
    this.status[InterventionStatus.SETTLED] = {colorClass: 'warn', value: 'Prête pour envoi dans Optitime'};
    this.status[InterventionStatus.TO_SCHEDULE] = {colorClass: 'warn', value: 'En attente planification Optitime'};
    this.status[InterventionStatus.SCHEDULED] = {colorClass: 'green', value: 'Planifiée'};
    this.status[InterventionStatus.INCOMPLETE] = {colorClass: 'green', value: 'Rapport incomplet'};
    this.status[InterventionStatus.DONE] = {colorClass: 'green', value: 'Rapport final reçu'};

    technicalActService.getAll().subscribe(res => this.technicalActs = res);
  }

  setPreview(elem: NewAccount) {
    // @ts-ignore
    this.sidePanel.toggle(elem.index);
  }

  loadSidePanelData(elem: NewIntervention) {
    this.sidePanelContent.element = [];
    this.sidePanelContent.element.push({title: 'Accès au bien', content: [], isLoading: true});
    this.sidePanelContent.element.push({title: 'Planification', content: [], isLoading: true});
    this.sidePanelContent.element.push({title: 'Rapport - Commande', content: [], isLoading: true});
    this.sidePanelContent.element.push({title: 'Rapport - Expert', content: [], isLoading: true});
    this.sidePanelContent.element.push({title: 'Bien', content: [], isLoading: true});

    this.service.getOne(elem.id).subscribe(res => {
      if (res) {
        const settled = res.asSettled();
        if (settled) {
          const inter = settled.parameters;

          if (inter.accessConditions) {
            this.sidePanelContent.getElement('Accès au bien').content.push(
              {label: 'Conditions d\'accès', value: inter.accessConditions}
            );
          }
          if (inter.accessDetails) {
            this.sidePanelContent.getElement('Accès au bien').content.push(
              {label: 'Précisions d\'accès', value: inter.accessDetails}
            );
          }
        }
      }
      this.sidePanelContent.getElement('Accès au bien').isLoading = false;

      if (res && (res.isSchedule || res.isDone)) {
        const expert = res.asSchedule().planning.expert;
        const expertName = [expert.firstName, expert.lastName].filter((s) => !!s).join(' ');
        if (!!expertName) {
          this.sidePanelContent.getElement('Planification').content.push(
            {label: 'Expert', value: expertName}
          );
        }
      }
      if (res.asSchedule() && res.asSchedule().planning && res.asSchedule().planning) {
        if (res.asSchedule().planning.startingTime) {
          this.sidePanelContent.getElement('Planification').content.push(
            {label: 'Date du rendez-vous', value: moment(res.asSchedule().planning.startingTime).format('dd/MM/yyyy')}
          );

          this.sidePanelContent.getElement('Planification').content.push(
            {label: 'Heure du rendez-vous', value: moment(res.asSchedule().planning.startingTime).format('HH:mm')}
          );
        }
        if (res.asSchedule().planning.duration) {
          this.sidePanelContent.getElement('Planification').content.push(
            {label: 'Durée de l\'intervention', value: this.secondsToHumanReadable(res.asSchedule().planning.duration)}
          );
        }
      }

      this.sidePanelContent.getElement('Planification').isLoading = false;
    });

    forkJoin(
      this.prestationService.getFromOrder(elem.order.id),
      this.orderService.getOne(elem.order.id)
    ).subscribe((res: [Prestation[], Order]) => {
      const analyseWithOrderLineList: Analyse[] = res[0].filter(p => p.analyse && p.analyse.orderLineId).map(p => p.analyse);
      const orderedAnalyses = analyseWithOrderLineList.length > 0 ? res[1].orderLines.filter(ol => analyseWithOrderLineList.map(a => a.orderLineId).findIndex(aol => aol === ol.uuid) > -1)
        .map(ol => ol.quantity)
        .reduce((prev, cur) => prev + cur, 0) : 0;

      this.sidePanelContent.getElement('Rapport - Commande').content.push(
        {label: 'Prestations commandés', value: elem.prestations},
        {label: 'Nombre d\'analyses estimées', value: orderedAnalyses}
      );

      if (res[1].workdescription) {
        this.sidePanelContent.getElement('Rapport - Commande').content.push(
          {label: 'Descriptif travaux', value: res[1].workdescription}
        );
      }

      this.sidePanelContent.getElement('Rapport - Commande').isLoading = false;

      const perfomedPrestationList = res[0].filter(presta => presta.resultId && presta.estate === elem.estate.id);
      const done: TechnicalAct[] = perfomedPrestationList.map(presta => {
        if (presta.resultId) {
          return this.technicalActs.find(value => value.uuid === presta.technicalAct.uuid);
        }
        return null;
      }).filter(e => e);
      console.log(done);

      this.sidePanelContent.getElement('Rapport - Expert').content.push(
        {label: 'Prestations réalisées', value: done.map(a => a.shortcut)}
      );

      if (elem.order.workdescription) {
        this.sidePanelContent.getElement('Rapport - Expert').content.push(
          {label: 'Descriptif des travaux réels', value: elem.order.workdescription}
        );
      }
    });

    this.sidePanelContent.getElement('Rapport - Expert').isLoading = false;

    this.prestationService
      .getFromOrder(elem.order.id)
      .pipe(mergeMap(prestation => {
        return this.estateService.get(prestation[0].estate).pipe(map(estate => {
          return {prestation: prestation[0], estate: estate};
        }));
      })).subscribe((e: { estate: Estate, prestation: Prestation }) => {
        this.sidePanelContent.getElement('Bien').content.push(
          {label: 'Client', value: EstateUtils.getOwnerName(e.estate)},
          {label: 'Référence', value: e.estate.estateReference ? e.estate.estateReference : e.estate.adxReference},
          {label: 'Type de bien', value: e.estate.customEstateType ? e.estate.customEstateType : e.estate.estateType.type}
        );

        if (e.estate.localities.length > 0 && e.estate.localities[0].addresses.length > 0) {
          const address: Address = EstateUtils.getAddressFromPrestation(e.estate, e.prestation);
          if (address.postCode && address.city) {
            this.sidePanelContent.getElement('Bien').content.push({
              label: 'Ville',
              value: address.postCode + ' ' + address.city
            });
          }
          if (address.address1) {
            this.sidePanelContent.getElement('Bien').content.push({label: 'Adresse', value: address.address1});
          }
          if (address.address2) {
            this.sidePanelContent.getElement('Bien').content.push({label: 'Complément', value: address.address2});
          }
          if (address.gpsCoordinates) {
            this.sidePanelContent.getElement('Bien').content.push({label: 'GPS: ', value: address.gpsCoordinates});
          }
          if (address.inseeCoordinates) {
            this.sidePanelContent.getElement('Bien').content.push({label: 'INSEE: ', value: address.inseeCoordinates});
          }
          if (e.estate.localities[0].premises.length > 0) {
            const premises: Premises = e.estate.localities[0].premises[0];
            if (premises.number) {
              this.sidePanelContent.getElement('Bien').content.push({label: 'No. de logement', value: premises.number});
            }
            if (premises.floor) {
              this.sidePanelContent.getElement('Bien').content.push({label: 'Étage', value: premises.floor});
            }
          }
        }

        this.sidePanelContent.getElement('Bien').isLoading = false;
      }
    );
  }

  private secondsToHumanReadable(seconds: number) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }
}
