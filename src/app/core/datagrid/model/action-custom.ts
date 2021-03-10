import {ActionType} from './action.type.enum';
import {Action} from './action';

export class ActionCustom extends Action {
  public id: any;
  public label: string;
  public icon: string;
  public show?: (elem) => boolean;


  constructor(click: (elem) => void, id: any, label: string, icon: string, force = false, disable?: (elem) => boolean, show?: (elem) => boolean) {
    super(ActionType.CUSTOM, click, force, disable);
    this.id = id;
    this.label = label;
    this.icon = icon;
    this.show = show;
  }
}
