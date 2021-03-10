import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatefieldComponent } from './datefield.component';

describe('DatefieldComponent', () => {
  let component: DatefieldComponent;
  let fixture: ComponentFixture<DatefieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatefieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatefieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
