import {Injectable} from '@angular/core';
import {Prestation} from '../backend/prestations.service';
import {SortService} from './sort.service';
import {map, take} from 'rxjs/internal/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {ResultsService} from '../backend/results.service';
import {TechnicalAct} from '../backend/technical-act.service';

@Injectable()
export class LinesService {

  constructor(
    private sortService: SortService,
    private resultsService: ResultsService,
  ) {
  }

  getRefAdx(prestationTypes: TechnicalAct[], analyse: boolean): string {
    if (prestationTypes.length === 0 && analyse) {
      return 'Analyse';
    } else if (prestationTypes.length === 1 && !analyse) {
      const prestationType = prestationTypes[0];
      if (prestationType.shortcut) {
        return prestationType.shortcut;
      }
    } else {
      prestationTypes.sort((a, b) => {
        return this.sortService.sortPrestationTypes(a, b);
      });
      let refTemp = '';
      for (const prestationType1 of prestationTypes) {
        refTemp = refTemp + prestationType1.shortcut.substring(0, 2);
      }
      if (analyse) {
        refTemp = refTemp + 'AN';
      }
      return 'P' + refTemp.trim() + '';
    }
  }

  getTotalAnalyseCount(prestations: Prestation[]): Observable<number> {
    // first:
    //   filters tech act with analyse and with resultId (some may be listed without resultId and therefore should be ignored)
    // then:
    //   get the resultWithAnalyse associated to these prestations
    // finally:
    //   sum analyseCount for all these results

    const prestaWithAnalyseList = prestations.filter(p => p.technicalAct.hasAnalyse && !!p.resultId);

    if (prestaWithAnalyseList.length > 0) {
      return forkJoin(prestaWithAnalyseList.map(p => {
        return this.resultsService.getResultWithAnalyse(p).pipe(take(1));
      }))
      .pipe(map(resultList => {
        if (resultList.filter(r => !!r).length > 0) {
          return resultList.filter(r => !!r).map(result => (result.analyseCount || 0)).reduce((previousValue, currentValue) => previousValue + currentValue);
        } else {
          return NaN;
        }
      }));

    } else {
      return of(NaN);
    }
  }
}
