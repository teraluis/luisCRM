import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {InterventionReportresultsComponent} from "./intervention-reportresults.component";

describe('Modules.InterventionReportresultsComponent', () => {
  let component: InterventionReportresultsComponent;
  let fixture: ComponentFixture<InterventionReportresultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InterventionReportresultsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterventionReportresultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
