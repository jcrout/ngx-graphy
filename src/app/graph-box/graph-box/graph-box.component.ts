import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { GraphFunction } from '../graph-models';
import { GraphLine } from '../../equation-box/equation-box/equation-box.component';

export type LabelFormatter = (num: Number) => string;

export interface GraphLabel {
  text: string;
  x: number;
  y: number;
  color: string;
}

@Component({
  selector: 'graphy-graph-box',
  templateUrl: './graph-box.component.html',
  styleUrls: ['./graph-box.component.scss']
})
export class GraphBoxComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('cvs') cvs: ElementRef;
  @Input() labelFormatter: LabelFormatter;
  @Input() graphFunctions: GraphFunction[];
  @Input() clearGraphOnEmptyFunction = false;
  @Input() showGridlines = true;
  @Input() showAxis = true;
  @Input() labelColor = 'gray';
  @Input() functionLineColor = 'red';
  @Input() functionLineThickness = 3;
  @Input() axisColor = 'black';
  @Input() axisThickness = 3;
  @Input() gridMajorColor = 'gray';
  @Input() gridMinorColor = 'darkgray';
  @Input() gridMajorThickness = 1;
  @Input() gridMinorThickness = 1;
  @Input() gridXStep = 2;
  @Input() gridYStep = 2;

  @Input()
  set axisX(value: number) {
    if ((!value && value !== 0) || value < this._leftBound || value > this._rightBound) {
      this._axisX = (this._leftBound + this._rightBound) / 2;
    } else {
      this._axisX = value;
    }
  }
  get axisX(): number {
    return this._axisX;
  }

  @Input()
  set axisY(value: number) {
    if ((!value && value !== 0) || value < this._bottomBound || value > this._topBound) {
      this._axisY = (this._topBound + this._bottomBound) / 2;
    } else {
      this._axisY = value;
    }
  }
  get axisY(): number {
    return this._axisY;
  }

  @Input()
  set rightBound(value: number) {
    this.handleSet('_rightBound', value, 10);
  }
  get rightBound(): number {
    return this._rightBound;
  }

  @Input()
  set leftBound(value: number) {
    this.handleSet('_leftBound', value, -10);
  }
  get leftBound(): number {
    return this._leftBound;
  }

  @Input()
  set topBound(value: number) {
    this.handleSet('_topBound', value, 10);
  }
  get topBound(): number {
    return this._topBound;
  }

  @Input()
  set bottomBound(value: number) {
    this.handleSet('_bottomBound', value, -10);
  }
  get bottomBound(): number {
    return this._bottomBound;
  }

  public labels: GraphLabel[] = [];

  private _axisXManuallySet = false;
  private _axisX = 0;
  private _axisYManuallySet = false;
  private _axisY = 0;
  private _rightBoundManuallySet = false;
  private _rightBound = 10;
  private _leftBoundManuallySet = false;
  private _leftBound = -10;
  private _topBoundManuallySet = false;
  private _topBound = 10;
  private _bottomBoundManuallySet = false;
  private _bottomBound = -10;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shouldDraw = false;
  private graphWidth = 0;
  private graphHeight = 0;
  private graphFineGrain = 10;
  private graphSizeTimerKey: any;
  private initialDraw = false;

  private graphBoxContainer: HTMLDivElement;
  private mouseMoveListener: any;
  private lastMouseX: number;
  private lastMouseY: number;

  // calculated values
  private nWidth: number;
  private nHeight: number;
  private xUnit: number;
  private yUnit: number;
  private yOrigin: number;
  private xOrigin: number;
  private panning = false;

  private handleSet(prop: string, value: any, defaultValue?: any) {
    if (!value && value !== 0) {
      this[prop + 'ManuallySet'] = false;
      this._leftBoundManuallySet = false;
      this._leftBound = defaultValue;
    } else {
      this[prop + 'ManuallySet'] = true;
      this[prop] = value;
    }
  }

  constructor() { }

  ngOnInit() {
    const that = this;

    this.canvas = <HTMLCanvasElement>this.cvs.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.graphBoxContainer = <HTMLDivElement>this.canvas.parentElement;
    this.graphWidth = this.canvas.clientWidth;
    this.graphHeight = this.canvas.clientHeight;
    this.canvas.width = that.graphWidth;
    this.canvas.height = that.graphHeight;
    this.plotGraphIfReady();

    this.graphSizeTimerKey = window.setInterval(() => {
      if (that.canvas.clientWidth !== that.graphWidth || that.canvas.clientHeight !== that.graphHeight) {
        that.graphWidth = that.canvas.clientWidth;
        that.graphHeight = that.canvas.clientHeight;
        that.canvas.width = that.graphWidth;
        that.canvas.height = that.graphHeight;
        that.plotGraph();
      }
    }, 1000);

    
  }

  ngOnDestroy() {
    if (this.graphSizeTimerKey) {
      window.clearInterval(this.graphSizeTimerKey);
      this.graphSizeTimerKey = null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['graphFunctions']) {
      this.shouldDraw = true;
      this.plotGraphIfReady();
    }
  }

  private plotGraphIfReady() {
    if (this.shouldDraw && this.canvas) {
      this.shouldDraw = false;
      this.plotGraph();
    }
  }

  plotGraph() {
    const that = this;
    this.shouldDraw = false;

    if (!this.graphFunctions || this.graphFunctions.length === 0) {
      if (!this.initialDraw || this.clearGraphOnEmptyFunction) {
        this.calculateCoreValues();
        this.drawBase();
      }
    } else {
      this.calculateCoreValues();
      this.drawBase();
      this.graphFunctions.forEach(gf => {
        that.graphFunction(gf);
      });
      this.initialDraw = true;
    }
  }

  private graphFunction(fn: GraphFunction) {
    const outputter = fn.outputter;

    const c = this.canvas;
    const ctx = this.ctx;
    const cWidth = this.graphWidth;
    const cHeight = this.graphHeight;

    // const nWidth = this.rightBound - this.leftbound;
    // const nHeight = this.topBound - this.bottomBound;

    const lowerBound = -10;
    const upperBound = 10;
    const step = .1;
    let currentLine: GraphLine = null;
    let lines = <GraphLine[]>[];
    for (var i = lowerBound; i <= upperBound; i += step) {
      let output = outputter(i);
      let xval = this.xOrigin + (i * this.xUnit);
      let yval = this.yOrigin - (output * this.yUnit);

      if (i === lowerBound) {
        currentLine = <GraphLine>{
          x1: xval,
          y1: yval
        };
      } else {
        currentLine.x2 = xval;
        currentLine.y2 = yval;
        //if ((currentLine.x1 < this.rightBound && currentLine.y1 >))         
        lines.push(currentLine);
        currentLine = <GraphLine>{
          x1: xval,
          y1: yval
        };
      }
    }

    const functionLineThickness = this.functionLineThickness > 0 ? this.functionLineThickness : 3;
    ctx.strokeStyle = this.functionLineColor;
    ctx.lineWidth = functionLineThickness;
    ctx.beginPath();
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
    }
    ctx.stroke();
  }

  private calculateCoreValues() {
    const c = this.canvas;
    const ctx = this.ctx;
    const cWidth = this.graphWidth;
    const cHeight = this.graphHeight;

    this.nWidth = this.rightBound - this.leftBound;
    this.nHeight = this.topBound - this.bottomBound;
    this.xUnit = cWidth / this.nWidth;
    this.yUnit = cHeight / this.nHeight;
    if (this.leftBound >= 0) { 
      this.xOrigin = (0 - this.leftBound) * this.xUnit;
    } else { 
      const xPct = Math.abs(this.leftBound / this.nWidth);
      this.xOrigin = xPct * cWidth;
    }

    if (this.topBound >= 0) { 
      this.yOrigin = (0 - this.bottomBound) * this.yUnit;
    } else { 
      const yPct = Math.abs(this.bottomBound / this.nHeight);
      this.yOrigin = yPct * cHeight;
    }
  }

  private _labelFormatter(num: number): string {
    let txt = num.toFixed(1);
    return txt.endsWith('.0') ? txt.substr(0, txt.length - 2) : txt;
  }

  private drawBase() {
    function drawLabel(x: number, y: number, num: number, xAxis: boolean) {
      let txt = lblFmt(num);
      let metrics = ctx.measureText(txt);

      ctx.lineWidth = 1;
      if (xAxis) {
        let finalX = Math.min(cWidth - metrics.width - 3, Math.max(0, x - (metrics.width / 2)));
        let finalY = Math.max(fontHeight, Math.min(cHeight - 1, y + gridLineThickness + fontHeight));
        if (finalX + metrics.width + 1 > cWidth) {
          finalX = cWidth - metrics.width - 1;
        }
        //that.labels.push(<GraphLabel>{ text: txt, x: finalX, y: finalY, color: that.labelColor });
        ctx.fillRect(finalX, finalY - fontHeight + 2, metrics.width, fontHeight);
        ctx.strokeText(txt, finalX, finalY);
      } else {
        let finalX = Math.max(0, Math.min(cWidth - metrics.width - 3, x - axisThickness - metrics.width - 3)); // Math.max(0, x - (metrics.width / 2));
        let finalY = y + (fontHeight / 2);
        if (finalY + fontHeight + 1 > cHeight) {
          finalY = cHeight - 2;
        } else if (finalY < fontHeight) {
          finalY = fontHeight;
        }
        //that.labels.push(<GraphLabel>{ text: txt, x: finalX, y: finalY, color: that.labelColor });
        ctx.fillRect(finalX, finalY - fontHeight + 1, metrics.width, fontHeight);
        ctx.strokeText(txt, finalX, finalY);
      }
      ctx.lineWidth = gridLineThickness;
    }

    const that = this;
    const c = this.canvas;
    const ctx = this.ctx;
    const cWidth = this.graphWidth;
    const cHeight = this.graphHeight;
    ctx.clearRect(0, 0, cWidth, cHeight);

    const xUnit = cWidth / this.nWidth;
    const yUnit = cHeight / this.nHeight;
    const xStep = this.gridXStep * xUnit;
    const yStep = this.gridYStep * yUnit;

    const gridLineThickness = this.gridMajorThickness > 0 ? this.gridMajorThickness : 1;
    const axisThickness = this.axisThickness > 0 ? this.axisThickness : 3;
    let fontHeight = 13;
    let lblFmt = this.labelFormatter || this._labelFormatter;
    this.labels = [];

    if (this.showGridlines) {
      ctx.fillStyle = 'white';
      ctx.lineWidth = gridLineThickness;
      ctx.strokeStyle = this.gridMajorColor;
      ctx.font = fontHeight.toString() + 'px Arial';
      let num = 0;
      for (let i = this.xOrigin - xStep; i >= -1; i -= xStep) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, cHeight);
        ctx.stroke();
        num -= this.gridXStep;
        drawLabel(i, this.yOrigin, num, true)
      }
      num = 0;
      for (let i = this.xOrigin + xStep; i <= cWidth + 1; i += xStep) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, cHeight);
        ctx.stroke();
        num += this.gridXStep;
        drawLabel(i, this.yOrigin, num, true);
      }
      num = 0;
      for (let i = this.yOrigin - yStep; i >= -1; i -= yStep) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(cWidth, i);
        ctx.stroke();
        num -= this.gridYStep;
        drawLabel(this.xOrigin, i, num, false);
      }
      num = 0;
      for (let i = this.yOrigin + yStep; i <= cHeight + 1; i += yStep) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(cWidth, i);
        ctx.stroke();
        num += this.gridYStep;
        drawLabel(this.xOrigin, i, num, false);
      }
    }

    if (this.showAxis) {
      ctx.strokeStyle = this.axisColor;
      ctx.lineWidth = axisThickness;
      if (this.yOrigin <= cHeight && this.yOrigin >= 0) { 
        ctx.beginPath();
        ctx.moveTo(0, this.yOrigin);
        ctx.lineTo(cWidth, this.yOrigin);
        ctx.stroke();
      }
      if (this.xOrigin <= cWidth && this.xOrigin >= 0) { 
        ctx.beginPath();
        ctx.moveTo(this.xOrigin, 0);
        ctx.lineTo(this.xOrigin, cHeight);
        ctx.stroke();
      }
    }

  }

  scrolled(ev: MouseWheelEvent) {
    let zoomIn = ev.deltaY < 0;
    this.zoom(ev.offsetX, ev.offsetY, zoomIn);
    console.log(ev);
  }

  zoom(x: number, y: number, zoomIn: boolean) {
    this._bottomBoundManuallySet = false;
    this._topBoundManuallySet = false;
    this._leftBoundManuallySet = false;
    this._rightBoundManuallySet = false;

    const yPct = Math.abs(this.bottomBound / this.nHeight);
    const xPct = Math.abs(this.leftBound / this.nWidth);
    let modifier = zoomIn ? .5 : 2;
    let nw = this.nWidth * modifier;
    let nh = this.nHeight * modifier;
    this._leftBound *= modifier;
    this._rightBound *= modifier;
    this._bottomBound *= modifier;
    this._topBound *= modifier;
    this.plotGraph();
  }

  mousedown(ev: MouseEvent) { 
    console.log(ev);
    if (ev.button == 0) { 
      this.panning = true;
      this.mouseMoveListener = this.pan.bind(this);
      this.lastMouseX = ev.offsetX;
      this.lastMouseY = ev.offsetY;
      this.graphBoxContainer.onmousemove = this.mouseMoveListener;
    }
  }

  mouseup() {
    this.panning = false;
    //this.graphBoxContainer.removeEventListener('mousemove', this.mouseMoveListener);
    this.graphBoxContainer.onmousemove = null;
    this.mouseMoveListener = null;
  }

  pan(ev: MouseEvent) {
    if (ev.buttons == 0 || ev.button !== 0) { 
      this.graphBoxContainer.onmousemove = null;
      return;
    }

    let xDelta = (ev.offsetX - this.lastMouseX) / this.xUnit;
    let yDelta = (ev.offsetY - this.lastMouseY) / this.yUnit;
    this._leftBound -= xDelta;
    this._rightBound -= xDelta;
    this._topBound -= yDelta;
    this._bottomBound -= yDelta;
    this.lastMouseX = ev.offsetX;
    this.lastMouseY = ev.offsetY;
    //console.log(this._topBound + ', ' + this._rightBound + ', ' + this._bottomBound + ', ' + this._leftBound);
    this.plotGraph();

    const that = this;
    this.graphBoxContainer.onmousemove = null;

    window.setTimeout(() => { 
      that.graphBoxContainer.onmousemove = that.pan.bind(this);
    }, 20);
  }
}
