import {FilterType} from './filter-type.enum';

export class ColumnInfo {
  public name: string;
  public title: string;
  public routerLink?: (elem) => string;
  public routerParam?: string;
  public filterType?: FilterType;
  public clickable?: (elem) => void;
  public unclick?: (elem) => boolean;
  public selectOption?: string[];
  public maxWidthPx?: number;
  public enumString ?: {[key: string]: {colorClass: string, value: string}};
}
