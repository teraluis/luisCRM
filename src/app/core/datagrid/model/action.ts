import {ActionType} from './action.type.enum';

export class Action {
  public type: ActionType;
  public click: (elem) => void;
  public force?: boolean = false;
  public disable?: (elem) => boolean;


  constructor(type: ActionType, click: (elem) => void, force = false, disable?: (elem) => boolean) {
    this.type = type;
    this.click = click;
    this.force = force;
    this.disable = disable;
  }
}
