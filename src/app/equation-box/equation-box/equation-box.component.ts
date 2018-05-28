import { Component, OnInit, Input } from '@angular/core';
import { EquationParserService } from '../../equation-parser/equation-parser.service';
import { ParserPart, EqParseResults } from '../../equation-parser/equastion-parser-models';

export interface GraphLine { 
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
@Component({
  selector: 'graphy-equation-box',
  templateUrl: './equation-box.component.html',
  styleUrls: ['./equation-box.component.scss']
})
export class EquationBoxComponent implements OnInit {
  @Input() eq: string;
  
  parseResults: EqParseResults;
  parseSuccess = false;

  constructor(private equationParser: EquationParserService) { }

  ngOnInit() {
    
  }

  updateEq() {
    if (this.eq) { 
      this.parseResults = this.equationParser.parse(this.eq);
      this.parseSuccess = this.parseResults.errors.length === 0;
    } else { 
      this.parseResults = null;
      this.parseSuccess = false;
    }
  }
}
