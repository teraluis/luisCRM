import {Component, EventEmitter, OnInit} from '@angular/core';
import {ActionEvent, ActionType, ColumnInformation, DeletableTableLine, FilterType, TableOption} from "../table-search-list/table-search-list.component";
import {MenuStep, NavigationService} from "../../services/front/navigation.service";
import {Router} from "@angular/router";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {Product, ProductsService} from "../../services/backend/products.service";
import {ConfirmationComponent} from "../confirmation/confirmation.component";
import {PlusActionData} from "../plus-button/plus-button.component";
import {ProductFormData, ProductFormMode, ProductsFormComponent} from "../products-form/products-form.component";
import {ProductsFormDialogComponent} from "../products-form/products-form-dialog/products-form-dialog.component";
import {switchMap} from "rxjs/operators";
import {of} from "rxjs";
import {ManagementRights} from "../../core/rights/ManagementRights";


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  // Data-grid implementation
  isLoading = new EventEmitter<boolean>();
  options: TableOption[] = [TableOption.EDIT, TableOption.DELETE];
  displayedColumns = ['prestationCode', 'description', 'validity', 'surfaceType', 'productType', 'businessCode'];
  hiddenColumns = [];
  columnsInfos: ColumnInformation[] = [
    {name: this.displayedColumns[0], title: 'Code prestation', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[1], title: 'Description', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[2], title: 'Validité', filterType: FilterType.BOOLEAN, filterDisabled: false},
    {name: this.displayedColumns[3], title: 'Type de surface', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[4], title: 'Type de produit', filterType: FilterType.TEXT, filterDisabled: false},
    {name: this.displayedColumns[5], title: 'Code finance', filterType: FilterType.TEXT, filterDisabled: false}
  ];

  maxRows = 10;
  dataSourceChange = new EventEmitter<any>();
  action = false;
  private products: Product[];
  userRights: ManagementRights = new ManagementRights();
  constructor(
    private navigationService: NavigationService,
    private router: Router,
    private productsService: ProductsService,
    private dialog: MatDialog
  ) { }

  actionData: PlusActionData[] = [
    {
      label: 'Produit',
      icon: 'add',
      function: () => this.addProduct(),
      disabled: !this.userRights.baseline
    }
  ];

  ngOnInit() {
    this.navigationService.set({menu: MenuStep.PRODUITS, url: this.router.url});
  }

  setPageData(page = 0) {
    this.setFilterData('');
  }

  setFilterData(filter: string) {
    this.isLoading.emit(true);
    this.productsService.getAll().subscribe((products) => {
      this.products = products;
      const dataSource = new MatTableDataSource<ProductTableLine>(this.buildProductTableLine(products));
      this.dataSourceChange.emit({dataSource: dataSource, filter: filter});
      this.isLoading.emit(false);
    });
  }

  buildProductTableLine(products: any) {
    return products.map((product, i) => {
      const data: ProductTableLine = {
        position: i + 1,
        deletable: this.userRights.baseline,
        id: product.uuid,
        description: product.description,
        prestationCode: product.prestationCode,
        validity: product.validity,
        surfaceType: product.surfaceType,
        productType: product.productType,
        businessCode: product.businessCode,
      };
      return data;
    });
  }

  onLineClick(evt: ActionEvent) {
    const product: ProductTableLine = evt.event;
    if (evt.action === ActionType.EDIT) {
      this.addProduct(this.products.find(a => a.uuid === product.id));
    } else if (evt.action === ActionType.DELETE) {
      const deleteDialogRef: MatDialogRef<any> = this.dialog.open(ConfirmationComponent, {
        data: {title: 'Confirmation de suppression', text: 'Êtes-vous sûr de vouloir supprimer ce produit ?'},
        width: '40%'
      });
      deleteDialogRef
        .afterClosed()
        .pipe(switchMap(reason => reason ? this.productsService.delete(product.id) : of(null)))
        .subscribe((res) => res ? this.setPageData(0) : null);
    }
  }

  getComboList = () => {
    return {};
  }

  addProduct(product?: Product) {
    const data: ProductFormData = {
      mode: !product ? ProductFormMode.CREATE : ProductFormMode.EDIT,
      defaultData: product,
      disabled: !this.userRights.baseline
    };
    const addDialogRef: MatDialogRef<any> = this.dialog.open(ProductsFormDialogComponent, {
      width: '60%',
      data: data
    });
    addDialogRef.afterClosed().subscribe((resp) => {
      if (resp) {
        this.setPageData(0);
      }
    });
  }
}


export interface ProductTableLine extends DeletableTableLine {
  prestationCode: string;
  description: string;
  validity: string;
  surfaceType: string;
  productType: string;
  businessCode: string;
}

