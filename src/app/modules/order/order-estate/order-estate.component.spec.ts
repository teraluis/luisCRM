import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderEstateComponent } from './order-estate.component';

describe('OrderestateComponent', () => {
  let component: OrderEstateComponent;
  let fixture: ComponentFixture<OrderEstateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderEstateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderEstateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
