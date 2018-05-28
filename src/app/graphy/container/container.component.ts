import { Component, OnInit } from '@angular/core';
import { GraphFunction } from '../../graph-box/graph-models';
import { EquationParserService } from '../../equation-parser/equation-parser.service';
import { EqParseResults, FunctionGenerationResults } from '../../equation-parser/equastion-parser-models';

@Component({
  selector: 'graphy-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class GraphyContainerComponent implements OnInit {
  graphFunctions: GraphFunction[] = [];

  private lastParseResults: EqParseResults;
  private lastFnGenerationResults: FunctionGenerationResults;

  constructor(private parserSvc: EquationParserService) {
  }

  ngOnInit() {
    this.parserSvc.parsed.subscribe(results => this.equationParsed(results));
  }

  private equationParsed(results: EqParseResults) {
    if (results.errors.length === 0) { 
      this.lastFnGenerationResults = this.parserSvc.generateFunction(results);
      if (!this.lastFnGenerationResults.error) {
        this.graphFunctions = [
          <GraphFunction>{
            outputter: this.lastFnGenerationResults.output
          }
        ];
      }
    } else {
      this.graphFunctions = null;
    }    
  }
}
