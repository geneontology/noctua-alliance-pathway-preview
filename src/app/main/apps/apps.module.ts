import { NgModule } from '@angular/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaFormModule } from './noctua-form/noctua-form.module';
import { NoctuaPathwayModule } from './noctua-pathway/noctua-pathway.module';

@NgModule({
  imports: [
    NoctuaSharedModule,
    NoctuaFormModule,
    NoctuaPathwayModule
  ],
  exports: [
    NoctuaFormModule,
    NoctuaFormModule,
    NoctuaPathwayModule
  ],
  providers: [

  ],
  declarations: []

})

export class AppsModule {
}
