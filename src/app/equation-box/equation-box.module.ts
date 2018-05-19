import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquationBoxComponent } from './equation-box/equation-box.component';
import { EquationParserService } from './equation-parser.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    EquationBoxComponent
  ],
  exports: [
    EquationBoxComponent
  ],
  providers: [
    EquationParserService
  ]
})
export class EquationBoxModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: EquationBoxModule,
      providers: [
        EquationParserService
      ]
    };
  }
}
