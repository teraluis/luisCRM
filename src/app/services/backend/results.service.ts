import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {UtilitiesService} from "./utilities.service";
import {environment} from "../../../environments/environment";
import {catchError, map} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {UUID} from '../../core/UUID';
import {shortcuts} from './technical-act.service';
import {Prestation} from './prestations.service';

@Injectable()
export class ResultsService {
    // @ts-ignore
    baseUrl = environment.missionsUrl || environment.orbitUrl;

    constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    }

    add(shorcut: shortcuts, prestationId: string, sampleQuantity?: number, analyseQuantity?: number): Observable<UUID> {
        if (shorcut === shortcuts.RAAT || shorcut === shortcuts.DAPP) {
            return this.addAsbestos({
                prestationId: prestationId,
                analyseCount: sampleQuantity ? sampleQuantity : undefined,
                analysesLabo: analyseQuantity ? analyseQuantity : undefined
            });
        } else if (shorcut === shortcuts.GAZ) {
            return this.addGas({prestationId: prestationId});
        } else if (shorcut === shortcuts.ELEC) {
            return this.addElectricity({prestationId: prestationId});
        } else if (shorcut === shortcuts.PLOMB) {
            return this.addLead({prestationId: prestationId});
        } else if (shorcut === shortcuts.DPE) {
            return this.addDPE({prestationId: prestationId});
        } else {
            console.error('Unhandled shortcut ref: ' + shorcut);
            return of(null);
        }
    }

    getAsbestos(resultId: string): Observable<Asbestos> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/asbestos/${resultId}`;
        return this.httpClient.get<Asbestos>(url, {
            headers: utilities.headers
        }).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    addAsbestos(asbestos: NewAsbestos): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        // POST          /v1/:orga/results/asbestos
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/asbestos`;
        return this.httpClient.post<UUID>(
            url,
            asbestos,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    getElectricity(resultId: string): Observable<Electricity> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/electricity/${resultId}`;
        return this.httpClient.get<Electricity>(url, {
            headers: utilities.headers
        }).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    addElectricity(electricity: NewElectricity): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        // POST          /v1/:orga/results/electricity
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/electricity`;
        return this.httpClient.post<UUID>(
            url,
            electricity,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    getGas(resultId: string): Observable<Gas> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/gas/${resultId}`;
        return this.httpClient.get<Gas>(url, {
            headers: utilities.headers
        }).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    addGas(gas: NewGas): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        // POST          /v1/:orga/results/gas
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/gas`;
        return this.httpClient.post<UUID>(
            url,
            gas,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    // POST          /v1/:orga/results/lead
    addLead(lead: NewLead): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/lead`;
        return this.httpClient.post<UUID>(
            url,
            lead,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    // POST          /v1/:orga/results/dpe
    addDPE(dpe: NewDPE): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/dpe`;
        return this.httpClient.post<UUID>(
            url,
            dpe,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    // POST          /v1/:orga/results/termite
    addTermite(termite: NewTermite): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/termite`;
        return this.httpClient.post<UUID>(
            url,
            termite,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    // POST          /v1/:orga/results/measurement
    addMeasurement(measurement: NewMeasurement): Observable<UUID> {
        const utilities = this.utilitiesService.getUtilities();
        const url = `${this.baseUrl}/v1/${utilities.organizationName}/results/measurement`;
        return this.httpClient.post<UUID>(
            url,
            measurement,
            {headers: utilities.headers}
        ).pipe(map(
            (resp) => {
                return resp;
            }), catchError((error: HttpErrorResponse) => {
                this.utilitiesService.handleError(error);
                return of(null);
            }
        ));
    }

    getResultWithAnalyse(prestation: Prestation): Observable<ResultWithAnalyse> {
        if (!prestation.resultId) {
            return of(null);
        } else {
            switch (prestation.technicalAct.shortcut) {
                case shortcuts.RAAT:
                case shortcuts.DAPP:
                    return this.getAsbestos(prestation.resultId);
                default:
                    return of(null);
            }
        }
    }
}


export interface NewResult {
    prestationId: string;
}

export interface Result extends NewResult {
    prestationId: string;
    id: string;
}

export interface ResultWithAnalyse extends Result {
    analyseCount?: number;
    positiveAnalyseCount?: number;
    analysesLabo?: number;
    analysesLaboPositive?: number;
    analysesLaboNegative?: number;
}

export interface Asbestos extends ResultWithAnalyse {
    isPresent?: boolean;
    analyseCount?: number;
    positiveAnalyseCount?: number;
    analysesLabo?: number;
    analysesLaboPositive?: number;
    analysesLaboNegative?: number;
    n1?: number;
    n2?: number;
    n3?: number;
    ep?: number;
    ac1?: number;
    ac2?: number;
    workDescription?: string;
}

export interface Electricity extends Result {
    anomalyPresence?: boolean;
    electricityPresence?: boolean;
}

export interface Gas extends Result {
    isPresent?: boolean;
    gasType?: number;
    anomalyType1?: number;
    anomalyType2?: number;
    anomalyType3?: number;
    anomalyImmediateDanger?: number;
    anomaly32C?: number;
    DGINumber?: number;
}

export interface Lead extends Result {
    isPresent?: boolean;
    diagnosticNegativeUnit?: number;
    diagnosticDamagedPositiveUnit?: number;
    diagnosticCleanPositiveUnit?: number;
    diagnosticWorkingPositiveUnit?: number;
}

export interface DPE extends Result {
    consumptionScore?: string;
    consumptionValue?: string;
    greenhouseGasScore?: string;
    greenhouseGasValue?: string;
    heatingSystemType?: string;
    heatingSystemEnergy?: string;
    hotWaterSystemEnergy?: string;
    ADEME?: string;
}

export interface Termite extends Result {
    isPresent?: boolean;
}

export interface Measurement extends Result {
    carrezSurface?: string;
    livingSpace?: string;
}

export interface NewAsbestos extends NewResult {
    isPresent?: boolean;
    analyseCount?: number;
    positiveAnalyseCount?: number;
    analysesLabo?: number;
    analysesLaboPositive?: number;
    analysesLaboNegative?: number;
    n1?: number;
    n2?: number;
    n3?: number;
    ep?: number;
    ac1?: number;
    ac2?: number;
    workDescription?: string;
}

export interface NewElectricity extends NewResult {
    anomalyPresence?: boolean;
    electricityPresence?: boolean;
}

export interface NewGas extends NewResult {
    isPresent?: boolean;
    gasType?: number;
    anomalyType1?: number;
    anomalyType2?: number;
    anomalyType3?: number;
    anomalyImmediateDanger?: number;
    anomaly32C?: number;
    DGINumber?: number;
}

export interface NewLead extends NewResult {
    isPresent?: boolean;
    diagnosticNegativeUnit?: number;
    diagnosticDamagedPositiveUnit?: number;
    diagnosticCleanPositiveUnit?: number;
    diagnosticWorkingPositiveUnit?: number;
}

export interface NewDPE extends NewResult {
    consumptionScore?: string;
    consumptionValue?: string;
    greenhouseGasScore?: string;
    greenhouseGasValue?: string;
    heatingSystemType?: string;
    heatingSystemEnergy?: string;
    hotWaterSystemEnergy?: string;
    ADEME?: string;
}

export interface NewTermite extends NewResult {
    isPresent?: boolean;
}

export interface NewMeasurement extends NewResult {
    carrezSurface?: string;
    livingSpace?: string;
}
