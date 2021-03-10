import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AProduct, Product, ProductsService, ProductType, SurfaceType} from "../../services/backend/products.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TechnicalActService} from "../../services/backend/technical-act.service";
import {Observable} from "rxjs";

@Component({
  selector: 'app-products-form',
  templateUrl: './products-form.component.html',
  styleUrls: ['./products-form.component.scss']
})
export class ProductsFormComponent implements OnInit, OnChanges {

  @Input() data: ProductFormData;
  @Input() newUpdate;
  @Output() productSaved = new EventEmitter<Product>();
  @Output() removeProduct = new EventEmitter<void>();
  @Output() cancelAction = new EventEmitter<void>();
  saving = false;
  productForm: FormGroup;
  technicalProductChoice: TechnicalProductChoice[];
  surfaceTypeChoice: SurfaceType[];
  productTypeChoice: ProductType[];
  constructor(private fb: FormBuilder, private productsService: ProductsService, private technicalActService: TechnicalActService) { }

  ngOnInit() {
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initialize();
  }

  initialize() {
    this.technicalProductChoice = [];
    this.technicalActService.getAll().subscribe((technicals) => {
      technicals.forEach(technical => {
        this.technicalProductChoice.push({id: technical.uuid, label: technical.name});
      });
    });
    this.surfaceTypeChoice = [];
    this.productsService.getAllSurfaceTypes().subscribe( (surfaces) => {
      surfaces.map( surface => {
        this.surfaceTypeChoice.push(surface);
      });
    });
    this.productTypeChoice = [];
    this.productsService.getAllProductTypes().subscribe( (products) => {
      products.map(product => {
        this.productTypeChoice.push(product);
      });
    });
    switch (this.data.mode) {
      case ProductFormMode.CREATE:
        this.productForm = this.fb.group({
          prestationCode: ['', Validators.required],
          validity: ['', Validators.required],
          targetId: ['', Validators.required],
          comment: '',
          description: ['', Validators.required],
          surfaceType: ['', Validators.required],
          productType: ['', Validators.required],
          offerCode: '',
          webActive: ['', Validators.required],
          fieldCode: '',
          jobRank: ['', Validators.required],
          equipment: ['', Validators.required],
          businessCode: ['', Validators.required]
        });
        break;
      case ProductFormMode.EDIT:
        this.productForm = this.fb.group({
          prestationCode: [{value: this.data.defaultData.prestationCode, disabled: this.data.disabled}, Validators.required],
          validity: [{value: this.data.defaultData.validity ? "true" : "false", disabled: this.data.disabled}, Validators.required],
          targetId: [{value: this.data.defaultData.targetId, disabled: this.data.disabled}, Validators.required],
          comment: [{value: this.data.defaultData.comment, disabled: this.data.disabled}],
          description: [{value: this.data.defaultData.description, disabled: this.data.disabled}, Validators.required],
          surfaceType: [{value: this.data.defaultData.surfaceType, disabled: this.data.disabled}, Validators.required],
          productType: [{value: this.data.defaultData.productType, disabled: this.data.disabled}, Validators.required],
          offerCode: [{value: this.data.defaultData.offerCode, disabled: this.data.disabled}],
          webActive: [{value: this.data.defaultData.webActive ? "true" : "false", disabled: this.data.disabled}, Validators.required],
          fieldCode: [{value: this.data.defaultData.fieldCode, disabled: this.data.disabled}],
          equipment: [{value: this.data.defaultData.equipment, disabled: this.data.disabled}, Validators.required],
          jobRank: [{value: this.data.defaultData.jobRank, disabled: this.data.disabled}, Validators.required],
          businessCode: [{value: this.data.defaultData.businessCode, disabled: this.data.disabled}, Validators.required]
        });
        break;
      default:
        this.cancelAction.emit();
    }
  }

  save() {
    console.log(this.productForm.getRawValue().validity);
    const product = new AProduct(
      this.data.defaultData ? this.data.defaultData.uuid : '',
      this.productForm.getRawValue().businessCode,
      this.productForm.getRawValue().comment,
      this.productForm.getRawValue().description,
      this.productForm.getRawValue().fieldCode,
      this.productForm.getRawValue().equipment,
      this.productForm.getRawValue().jobRank,
      this.productForm.getRawValue().offerCode,
      this.productForm.getRawValue().prestationCode,
      this.productForm.getRawValue().productType,
      this.productForm.getRawValue().surfaceType,
      this.productForm.getRawValue().targetId,
      this.productForm.getRawValue().validity,
      this.productForm.getRawValue().webActive
    );
    switch (this.data.mode) {
      case ProductFormMode.CREATE:
        this.saving = true;
        this.productsService.add(product).subscribe( (newUuid) => {
          product.uuid = newUuid.uuid;
          this.productSaved.emit(product);
          setTimeout(() => this.saving = false);
        });
        break;
      case ProductFormMode.EDIT:
        this.saving = true;
        this.productsService.update(product).subscribe( (updated) => {
          this.productSaved.emit(product);
          setTimeout(() => this.saving = false);
        });
        break;
    }
  }

  cancel() {
    this.cancelAction.emit();
  }
}

export interface ProductFormData {
  mode: ProductFormMode | string;  // Create mode
  disabled?: boolean;                   // Disable fields
  deletable?: boolean;                  // Show delete button
  defaultData?: Product;          // Default data
}

export enum ProductFormMode {
  CREATE = 'create',
  EDIT = 'edit',
}
export interface TechnicalProductChoice {
  id: string;
  label: string;
}

