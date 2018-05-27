import { Component, OnInit } from '@angular/core';
import { EquationParserService } from '../../equation-parser/equation-parser.service';
import { ParserPart, EqParseResults } from '../../equation-parser/equastion-parser-models';

@Component({
  selector: 'app-equation-box',
  templateUrl: './equation-box.component.html',
  styleUrls: ['./equation-box.component.css']
})
export class EquationBoxComponent implements OnInit {
  testVal: EqParseResults;
  testLine1: string;
  testLine2: string;
  eq: string;
  constructor(public equationParser: EquationParserService) { }

  ngOnInit() {
    //this.eq = 'x^2.2 + A -1.9(absabs(x) + 1)^1.1';
    //this.eq = 'absabs(x) + abs';
    //this.eq = '5abs(x) + 10.2min(x,1/2x,x^2)';
    //this.eq = '1abcdg)f + )hg';
    //this.eq = '.5xamin(x, 2) + absoo(x, x - 3)'
    //this.eq = '-5abs(x) --3^2';
    //this.eq = '-5ab + bmin(3, 1 - 2x^2 + 2/5)';
    this.eq = '53x^2/3-5*3+3/5';
    const timestamp = Date.now();

    //for (let i = 0; i < 500; i++) {
    this.testVal = this.equationParser.parse(this.eq);    
    //}

    const timestamp2 = Date.now();
    console.log('All: ' + (timestamp2 - timestamp) + 'ms');

    if (this.testVal.errors.length === 0) { 
      const something = this.equationParser.generateFunction(this.testVal);
      console.log(something.output(7.3));
    }


    this.tempClean(this.testVal.equationPart);
    this.testLine1 = '';
    this.testLine2 = '';
    for (let i = 0; i < this.eq.length; i++) {
      this.testLine1 += ' ' + this.eq[i] + ' ';
      this.testLine2 += (i < 10 ? ' 0' : ' ') + i.toString();
    }
  }

  tempClean(part: ParserPart) {
    delete part.member;
    part.parts.forEach(p => this.tempClean(p));
  }
}
