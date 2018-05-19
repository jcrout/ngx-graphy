import { TestBed, inject } from '@angular/core/testing';

import { EquationParserService } from './equation-parser.service';

describe('EquationParserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EquationParserService]
    });
  });

  it('should be created', inject([EquationParserService], (service: EquationParserService) => {
    expect(service).toBeTruthy();
  }));
});
