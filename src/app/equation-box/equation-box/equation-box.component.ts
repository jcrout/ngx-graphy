import { Component, OnInit } from '@angular/core';
import { EquationParserService } from '../equation-parser.service';

@Component({
  selector: 'app-equation-box',
  templateUrl: './equation-box.component.html',
  styleUrls: ['./equation-box.component.css']
})
export class EquationBoxComponent implements OnInit {
  testVal: any;
  testLine1: string;
  testLine2: string;
  eq: string;
  constructor(public equationParser: EquationParserService) { }

  ngOnInit() {
    //this.eq = 'x^2.2 + A -1.9(absabs(x) + 1)^1.1';
    //this.eq = 'absabs(x) + abs';
    this.eq = '2.2x + 2absd + 1';
    this.testVal = this.equationParser.parse(this.eq);
    this.testLine1 = '';
    this.testLine2 = '';
    for (let i = 0; i < this.eq.length; i++) { 
      this.testLine1 += ' ' + this.eq[i] + ' ';
      this.testLine2 += (i < 10 ? ' 0' : ' ') + i.toString();
    }
  }

}
