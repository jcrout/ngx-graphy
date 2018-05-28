import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EquationBoxPanelsComponent } from './equation-box-panels.component';

describe('EquationBoxPanelsComponent', () => {
  let component: EquationBoxPanelsComponent;
  let fixture: ComponentFixture<EquationBoxPanelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EquationBoxPanelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EquationBoxPanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
