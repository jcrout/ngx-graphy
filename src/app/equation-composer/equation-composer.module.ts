import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquationComposerService } from './equation-composer.service';
import { EquationParserModule } from '../equation-parser/equation-parser.module';

@NgModule({
  imports: [
    CommonModule,
    EquationParserModule.forRoot()
  ],
  declarations: [],
  providers: [
    EquationComposerService
  ]
})
export class EquationComposerModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: EquationComposerModule,
      providers: [
        EquationComposerService
      ]
    };
  }
}
