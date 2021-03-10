import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {ProductsService, ProductType, SurfaceType} from "../../services/backend/products.service";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: 'app-surface-type-form',
  templateUrl: './surface-type-form.component.html',
  styleUrls: ['./surface-type-form.component.scss']
})
export class SurfaceTypeFormComponent implements OnInit {

  @Output() cancelAction = new EventEmitter<void>();
  @Output() added = new EventEmitter<boolean>();

  surfaceTypeControl: FormControl;
  surfaceTypeOptions: SurfaceType [] = [];
  surfaceFilteredOptions: Observable<SurfaceType[]>;

  saving = false;
  alreadyExists = false;
  message = "";

  constructor(private productsService: ProductsService) { }

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    this.surfaceTypeControl = new FormControl('');
    this.productsService.getAllSurfaceTypes().subscribe((surfaces) => {
      surfaces.map( product => {
        this.surfaceTypeOptions.push(product);
      });
    });
    this.surfaceFilteredOptions = this.surfaceTypeControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.label),
        map(name => name ? this._filter(name) : this.surfaceTypeOptions.slice())
      );
  }

  displayFn(surfaceType: SurfaceType): string {
    return surfaceType && surfaceType.label ? surfaceType.label : '';
  }

  private _filter(name: string): ProductType[] {
    const filterValue = name.toLowerCase();

    return this.surfaceTypeOptions.filter(option => option.label.toLowerCase().indexOf(filterValue) === 0);
  }

  submitSurfaceType() {
    this.saving = true;
    this.productsService.addSurfaceType(this.surfaceTypeControl.value).subscribe( (res) => {
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

  isValid() {
    return this.surfaceTypeOptions.includes(this.surfaceTypeControl.value)
      || (this.surfaceTypeControl.value.toString().length < 3);
  }

  isNewSurfaceType() {
    return this.surfaceTypeOptions.includes(this.surfaceTypeControl.value);
  }

  cancel() {
    this.cancelAction.emit();
  }

  addMessage(added: boolean) {
    if (added) {
      this.message = "Le type de surface " + this.surfaceTypeControl.value + " a été ajouté avec succès";
      this.alreadyExists = false;
    } else {
      this.alreadyExists = true;
      this.message = "Le type de surface existe déjà.";
    }
    setTimeout( () => {
      this.message = "";
    }, 10000);
  }
}
