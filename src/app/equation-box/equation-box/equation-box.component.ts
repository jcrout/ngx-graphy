import { Component, OnInit } from '@angular/core';
import { EquationParserService } from '../equation-parser.service';

@Component({
  selector: 'app-equation-box',
  templateUrl: './equation-box.component.html',
  styleUrls: ['./equation-box.component.css']
})
export class EquationBoxComponent implements OnInit {
  testVal: any;

  constructor(public equationParser: EquationParserService) { }

  ngOnInit() {
    this.testVal = this.equationParser.parse('x^2 + A -2(abs(x) + 1)^1.1');
  }

}
