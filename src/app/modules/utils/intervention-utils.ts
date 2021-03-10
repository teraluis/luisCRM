import {MaterializedIntervention} from "../../services/backend/interventions.service";

export class InterventionUtils {

  public static getStatus(intervention: MaterializedIntervention) {
    if (intervention.isDone) {
      return InterventionStatus.DONE;
    } else if (intervention.isIncomplete) {
      return InterventionStatus.INCOMPLETE;
    } else if (intervention.isSchedule) {
      return InterventionStatus.SCHEDULED;
    } else if (intervention.isToSchedule) {
      return InterventionStatus.TO_SCHEDULE;
    } else if (intervention.isSettled) {
      return InterventionStatus.SETTLED;
    } else if (intervention.isCreated) {
      return InterventionStatus.CREATED;
    } else if (intervention.isDraft) {
      return InterventionStatus.DRAFT;
    } else {
      return null;
    }
  }

  public static getStatusFromLabel(status: string) {
    switch (status) {
      case InterventionStatusLabel.CREATED:
        return InterventionStatus.CREATED;
      case InterventionStatusLabel.SETTLED:
        return InterventionStatus.SETTLED;
      case InterventionStatusLabel.TO_SCHEDULE:
        return InterventionStatus.TO_SCHEDULE;
      case InterventionStatusLabel.SCHEDULED:
        return InterventionStatus.SCHEDULED;
      case InterventionStatusLabel.INCOMPLETE:
        return InterventionStatus.INCOMPLETE;
      case InterventionStatusLabel.DONE:
        return InterventionStatus.DONE;
      case InterventionStatusLabel.DRAFT:
        return InterventionStatus.DRAFT;
      default:
        return -1;
    }
  }

  public static getStatusColor = (key: InterventionStatus) => {
    switch (key) {
      case InterventionStatus.SCHEDULED:
      case InterventionStatus.INCOMPLETE:
      case InterventionStatus.DONE:
        return 'green';
      case InterventionStatus.DRAFT:
      case InterventionStatus.CREATED:
      case InterventionStatus.SETTLED:
      case InterventionStatus.TO_SCHEDULE:
        return 'warn';
      default:
        return 'grey';
    }
  }

  public static getStatusName = (key: InterventionStatus) => {
    switch (key) {
      case InterventionStatus.DRAFT:
        return 'Brouillon';
      case InterventionStatus.CREATED:
        return 'Créée';
      case InterventionStatus.SETTLED:
        return 'Prête pour envoi dans Optitime';
      case InterventionStatus.TO_SCHEDULE:
        return 'En attente planification Optitime';
      case InterventionStatus.SCHEDULED:
        return 'Planifiée';
      case InterventionStatus.INCOMPLETE:
        return 'Rapport incomplet';
      case InterventionStatus.DONE:
        return 'Rapport final reçu';
      default:
        return 'État inconnu';
    }
  }
}

export enum InterventionStatus {
  DRAFT,
  CREATED,
  SETTLED,
  TO_SCHEDULE,
  SCHEDULED,
  INCOMPLETE,
  DONE
}

export enum InterventionStatusLabel {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  SETTLED = 'SETTLED',
  TO_SCHEDULE = 'TO_SCHEDULE',
  SCHEDULED = 'SCHEDULED',
  INCOMPLETE = 'INCOMPLETE',
  DONE = 'DONE'
}

export enum InterventionAccess {
  FREEACCESS = 'Accès libre',
  PURCHASER = 'Sur place avec donneur d\'ordre',
  CLIENT = 'Sur place avec client final',
  TENANT = 'Sur place avec locataire',
  NEGOTIATOR = 'Sur place avec négociateur',
  BUYER = 'Sur place avec acquéreur',
  NOTARY = 'Sur place avec notaire',
  GUARDIAN = 'Sur place avec gardien',
  AGENCY = 'Clés à l\'agence',
  STUDY = 'Clés à l\'étude',
  OFFICE = 'Clés au bureau',
  PADLOCK = 'Code cadenas',
  DIGICODE = 'Digicode',
  SITEPASS = 'Pass chantier'
}

export enum InterventionPeopleRole {
  OWNER = 'Propriétaire',
  TENANT = 'Locataire',
  SITESUPERVISOR = 'Chef de chantier',
  CARETAKER = 'Gardien',
  MANAGER = 'Gestionnaire',
  OTHER = 'Autre'
}
