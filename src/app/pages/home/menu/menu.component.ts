import {Component, Input, OnInit} from '@angular/core';
import {MenuStep} from '../../../services/front/navigation.service';
import {Router} from '@angular/router';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ManagementRights} from '../../../core/rights/ManagementRights';

@Component({
  selector: 'app-menu-component',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({transform: 'rotate(0deg)'})),
      state('expanded', style({transform: 'rotate(180deg)'})),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ])
  ]
})
export class MenuComponent implements OnInit {
  @Input() menuItem: MenuLine;

  @Input() privileges: string[];
  @Input() isExpanded: boolean;
  @Input() depth = 0;

  hide = false;
  show = false;
  showSubMenu = false;

  constructor(
    public router: Router
  ) {
  }

  ngOnInit(): void {
    // Find active sub menu after page reload
    if (this.menuItem.asMenuItem() && this.menuItem.asMenuItem().children) {
      const routes = this.getAllChildrenRoute(this.menuItem.asMenuItem());
      if (routes.filter(route => this.router.url.startsWith(route)).length) {
        this.showSubMenu = true;
      }
    }
  }

  goTo(menuItem) {
    if (menuItem.enable) {
      this.router.navigate(menuItem.route_to);
    }
  }

  onItemSelected(item: MenuItem) {
    if (!item.children || !item.children.length || !item.action) {
      this.goTo(item);
    }
    if (item.children && item.children.length && item.enable) {
      this.showSubMenu = !this.showSubMenu;
    }
    if (item.action) {
      item.action();
    }
  }

  isActiveRoute() {
    return this.router.url.startsWith(this.menuItem.asMenuItem().route_to[0]) && !this.menuItem.asMenuItem().children;
  }


  getAllChildrenRoute(child: MenuItem): string[] {
    const res = [];
    if (child.children && child.children.length) {
      // Concat and flatten array of routes
      res.push(...child.children.reduce((acc, val) => acc.concat(...this.getAllChildrenRoute(val)), []));
    } else {
      res.push(child.route_to);
    }

    return res;
  }
}

export class MenuItem implements MenuLine {

  constructor(protected args: {
    id: string;
    label: string;
    icon: string;
    active: boolean;
    route_to?: [string];
    enable: boolean;
    defaultEnable: boolean;
    children?: MenuItem[];
    action?: () => void;
  }) {
  }

  id = this.args.id;
  label = this.args.label;
  icon = this.args.icon;
  active = this.args.active;
  route_to = this.args.route_to || [];
  enable = this.args.enable;
  defaultEnable = this.args.defaultEnable;
  children = this.args.children;
  action = this.args.action;

  isMenuItem = true;

  asMenuItem(): MenuItem {
    return this;
  }
}

export class WhiteLine implements MenuLine {
  isMenuItem = false;

  asMenuItem(): MenuItem {
    return undefined;
  }
}

export interface MenuLine {
  isMenuItem: boolean;

  asMenuItem(): MenuItem;
}

