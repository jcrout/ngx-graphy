import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquationParserService } from './equation-parser.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    EquationParserService
  ]
})
export class EquationParserModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: EquationParserModule,
      providers: [
        EquationParserService
      ]
    };
  }
}
