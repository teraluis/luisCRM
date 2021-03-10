import { Component, OnInit, Input } from '@angular/core';
import { ChartType, ChartOptions } from 'chart.js';
import { SingleDataSet, monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip } from 'ng2-charts';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {

  // importe les données nécessaires à la construction du graphique depuis le component parent
  @Input() pieChartData: SingleDataSet = [];
  @Input() labels: string[];
  @Input() pieColors: any[];

  // code pour la pie presente dans le dashboard, appelé dans le html du dashboard
  pieChartType: ChartType = 'pie';
  pieChartLegend = false;
  pieChartPlugins = [];
  pieChartOptions: ChartOptions = {
    responsive: true,
  };

  constructor() {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
  }


  ngOnInit(): void {
  }
}
