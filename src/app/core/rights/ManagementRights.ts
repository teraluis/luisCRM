
export class ManagementRights {

  public baseline: boolean;
  public orderManagement: boolean;
  public accountManagement: boolean;
  public financialManagemement: boolean;
  constructor() {
    this.baseline = localStorage.getItem('privileges').includes('baseline');
    this.orderManagement = localStorage.getItem('privileges').includes('orderManagement');
    this.accountManagement = localStorage.getItem('privileges').includes('accountManagement');
    this.financialManagemement = localStorage.getItem('privileges').includes('financialManagemement');
  }

}

