import {Component, OnInit, ViewChild} from "@angular/core";
import {SidePanelService} from "../../services/front/sidepanel.service";
import {MatSidenav} from "@angular/material/sidenav";

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss']
})
export class SidePanelComponent implements OnInit {

  @ViewChild('sidePanel') public sidePanel: MatSidenav;

  constructor(public sidePanelService: SidePanelService) {
  }

  ngOnInit(): void {
    this.sidePanelService.setSidePanel(this.sidePanel);
  }

}
