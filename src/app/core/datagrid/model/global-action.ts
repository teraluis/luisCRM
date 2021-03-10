import {GlobalActionType} from './global-action-type.enum';

export class GlobalAction {
  public type: GlobalActionType;
  public action?: (elem: any[], selectAll: boolean) => void;
}
