import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProductFormData, ProductFormMode} from "../products-form.component";
import {Product} from "../../../services/backend/products.service";

@Component({
  selector: 'app-products-form-dialog',
  templateUrl: './products-form-dialog.component.html',
  styleUrls: ['./products-form-dialog.component.scss']
})
export class ProductsFormDialogComponent implements OnInit {

  updated = false;

  constructor(public dialogRef: MatDialogRef<ProductsFormDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ProductFormData) { }

  ngOnInit() {
  }

  close(product?: Product) {
    if (product) {
      this.dialogRef.close(product);
    } else {
      this.dialogRef.close();
    }

  }
  update(updated?: boolean) {
    this.updated = !this.updated;
  }

  getTitle() {
    switch (this.data.mode) {
      case ProductFormMode.CREATE:
        return 'Ajouter un produit au catalogue';
      case ProductFormMode.EDIT:
        return this.data.disabled ? 'Consulter un produit du catalogue' : 'Modifier un produit';
      default:
        return 'Produit du catalogue';
    }
  }
}
