import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {generateInterventionId} from '../../core/intervention.utils';
import {ManagementRights} from "../../core/rights/ManagementRights";

@Component({
  template: ""
})
export class NewInterventionComponent implements OnInit {

  constructor(protected router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/intervention', generateInterventionId()]);
  }
}
