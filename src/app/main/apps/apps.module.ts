import { NgModule } from '@angular/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaPathwayModule } from './noctua-pathway/noctua-pathway.module';

@NgModule({
  imports: [
    NoctuaSharedModule,
    NoctuaPathwayModule,
  ],
  exports: [
  ],
  providers: [

  ]

})

export class AppsModule {
}
