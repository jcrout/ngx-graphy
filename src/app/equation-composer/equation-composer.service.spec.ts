import { TestBed, inject } from '@angular/core/testing';

import { EquationComposerService } from './equation-composer.service';

describe('EquationComposerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EquationComposerService]
    });
  });

  it('should be created', inject([EquationComposerService], (service: EquationComposerService) => {
    expect(service).toBeTruthy();
  }));
});
