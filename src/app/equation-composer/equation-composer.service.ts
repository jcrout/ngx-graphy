import { Injectable } from '@angular/core';
import { EquationParserService } from '../equation-parser/equation-parser.service';
import { EqParseResults } from '../equation-parser/equastion-parser-models';

@Injectable()
export class EquationComposerService {

  constructor(private equationParser: EquationParserService) { }

  generateFunction(parserResults: EqParseResults) { 

  }
}
