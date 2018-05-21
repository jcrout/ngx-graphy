import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquationBoxComponent } from './equation-box/equation-box.component';
import { EquationParserModule } from '../equation-parser/equation-parser.module';
import { EquationComposerModule } from '../equation-composer/equation-composer.module';

@NgModule({
  imports: [
    CommonModule,
    EquationParserModule.forRoot(),
    EquationComposerModule.forRoot()
  ],
  declarations: [
    EquationBoxComponent
  ],
  exports: [
    EquationBoxComponent
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
