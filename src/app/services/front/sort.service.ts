import {Injectable} from '@angular/core';
import {LineDraft} from '../../modules/billlines/billlines.component';
import {TechnicalAct} from '../backend/technical-act.service';

@Injectable()
export class SortService {

  sortString(a: string, b: string): number {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }

  sortPrestationTypes(a: TechnicalAct, b: TechnicalAct): number {
    const labelA = a.shortcut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const labelB = b.shortcut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return this.sortString(labelA, labelB);
  }

  sortOrderLineDraft(a: LineDraft, b: LineDraft): number {
    let aLength = a.prestations.length;
    if (a.hasAnalyse && aLength !== 0) {
      aLength = aLength + 1;
    }
    let bLength = b.prestations.length;
    if (b.hasAnalyse && bLength !== 0) {
      bLength = bLength + 1;
    }
    if (aLength !== bLength) {
      return bLength - aLength;
    } else {
      return this.sortString(a.refadx, b.refadx);
    }
  }

}
