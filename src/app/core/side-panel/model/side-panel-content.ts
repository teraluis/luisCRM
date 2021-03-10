import {SidePanelElement} from './side-panel-element';

export class SidePanelContent {
  public title: string;
  public element: SidePanelElement[] = [];

  constructor(title = '') {
    this.title = title;
  }

  getElement(title: string): SidePanelElement {
    return this.element.find(e => e.title === title) || new SidePanelElement();
  }
}
