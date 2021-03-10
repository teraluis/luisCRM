import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderPrestationDialogComponent } from './order-prestation-dialog.component';

describe('OrderprestationComponent', () => {
  let component: OrderPrestationDialogComponent;
  let fixture: ComponentFixture<OrderPrestationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderPrestationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderPrestationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
