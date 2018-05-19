import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EquationBoxComponent } from './equation-box.component';

describe('EquationBoxComponent', () => {
  let component: EquationBoxComponent;
  let fixture: ComponentFixture<EquationBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EquationBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EquationBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
