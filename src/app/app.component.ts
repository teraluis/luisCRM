import {Component, OnInit} from '@angular/core';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public color: string;
  public envName: string;
  public topEnvMessageEnable = false;

  ngOnInit() {
     if (environment.environment.value !== 'production') {
     this.color = environment.environment.color;
     this.envName = environment.environment.value;
     this.topEnvMessageEnable = true;
   }
  }

  closeInfoBox() {
    this.topEnvMessageEnable = false;
  }
}
