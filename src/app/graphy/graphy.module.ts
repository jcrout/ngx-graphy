import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { EquationBoxModule } from '../equation-box/equation-box.module';
import { GraphBoxModule } from '../graph-box/graph-box.module';
import { GraphyContainerComponent } from './container/container.component';

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    EquationBoxModule.forRoot(),
    GraphBoxModule.forRoot()
  ],
  declarations: [
    GraphyContainerComponent
  ],
  exports: [
    GraphyContainerComponent
  ]  
})
export class GraphyModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: GraphyModule,
      providers: [
      ]
    };
  }
}