import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquationBoxComponent } from './equation-box/equation-box.component';
import { EquationParserModule } from '../equation-parser/equation-parser.module';
import { FormsModule }   from '@angular/forms';
import { EquationBoxPanelsComponent } from './equation-box-panels/equation-box-panels.component';

@NgModule({
  imports: [
    CommonModule,
    EquationParserModule.forRoot(),
    FormsModule
  ],
  declarations: [
    EquationBoxComponent,
    EquationBoxPanelsComponent
  ],
  exports: [
    EquationBoxComponent,
    EquationBoxPanelsComponent
  ]
})
export class EquationBoxModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: EquationBoxModule,
      providers: [
      ]
    };
  }
}
