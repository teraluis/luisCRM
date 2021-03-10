import {SidePanelElementContent} from './side-panel-element-content';

export class SidePanelElement {
  public title: string;
  public isLoading ?: boolean = false;
  public content?: SidePanelElementContent[] = [];
}
