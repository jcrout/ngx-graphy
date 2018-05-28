import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphBoxComponent } from './graph-box/graph-box.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    GraphBoxComponent
  ],
  declarations: [
    GraphBoxComponent
  ]
})
export class GraphBoxModule {
  static forRoot(): ModuleWithProviders { 
    return {
      ngModule: GraphBoxModule,
      providers: [
      ]
    };
  }
 }
