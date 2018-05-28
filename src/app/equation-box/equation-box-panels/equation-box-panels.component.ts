import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'graphy-equation-box-panels',
  templateUrl: './equation-box-panels.component.html',
  styleUrls: ['./equation-box-panels.component.scss']
})
export class EquationBoxPanelsComponent implements OnInit {
  boxes: string[] = ['.52x^2'];

  constructor() { }

  ngOnInit() {
  }

}
