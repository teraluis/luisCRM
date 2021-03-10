import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BilllinesComponent } from './billlines.component';

describe('BilllinesComponent', () => {
  let component: BilllinesComponent;
  let fixture: ComponentFixture<BilllinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BilllinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BilllinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
