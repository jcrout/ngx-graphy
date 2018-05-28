import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphBoxComponent } from './graph-box.component';

describe('GraphBoxComponent', () => {
  let component: GraphBoxComponent;
  let fixture: ComponentFixture<GraphBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
