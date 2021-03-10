import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ProductsService, ProductType, SurfaceType} from "../../services/backend/products.service";
import {Observable} from "rxjs";
import {AbstractControl, FormControl, Validators} from "@angular/forms";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: 'app-product-type-form',
  templateUrl: './product-type-form.component.html',
  styleUrls: ['./product-type-form.component.scss']
})
export class ProductTypeFormComponent implements OnInit {

  @Output() cancelAction = new EventEmitter<void>();
  @Output() added = new EventEmitter<boolean>();

  productTypeControl: FormControl;
  productTypeOptions: ProductType [] = [];
  productTypeFilteredOptions: Observable<ProductType[]>;

  saving = false;
  alreadyExists = false;
  message = "";
  constructor(private productsService: ProductsService) { }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    this.productTypeControl = new FormControl('');
    this.productsService.getAllProductTypes().subscribe((products) => {
      products.map( product => {
        this.productTypeOptions.push(product);
      });
    });
    this.productTypeFilteredOptions = this.productTypeControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.label),
        map(name => name ? this._filter(name) : this.productTypeOptions.slice())
      );
  }

  displayFn(productType: ProductType): string {
    return productType && productType.label ? productType.label : '';
  }

  private _filter(name: string): ProductType[] {
    const filterValue = name.toLowerCase();

    return this.productTypeOptions.filter(option => option.label.toLowerCase().indexOf(filterValue) === 0);
  }

  isValid() {
    return this.productTypeOptions.includes(this.productTypeControl.value)
      || (this.productTypeControl.value.toString().length < 3);
  }

  isNewProductType() {
    return this.productTypeOptions.includes(this.productTypeControl.value);
  }

  submitProductType() {
    this.saving = true;
    this.productsService.addProductType(this.productTypeControl.value).subscribe( (res) => {
      if (res.uuid) {
        this.added.emit(true);
        this.initialize();
        this.addMessage(true);
      } else {
        this.added.emit(false);
        this.addMessage(true);
      }
      this.saving = false;
    });
  }

  cancel() {
    this.cancelAction.emit();
  }

  addMessage(added: boolean) {
    if (added) {
      this.message = "Le type de produit " + this.productTypeControl.value + " a été ajouté avec succès";
      this.alreadyExists = false;
    } else {
      this.alreadyExists = true;
      this.message = "Le type de produit existe déjà.";
    }
    setTimeout( () => {
      this.message = "";
    }, 10000);
  }
}

export function RequireMatch(control: AbstractControl) {
  const selection: any = control.value;
  if (typeof selection === 'string') {
    return { incorrect: true };
  }
  return null;
}
