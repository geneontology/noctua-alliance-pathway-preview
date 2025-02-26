import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaInlineEditorComponent } from './inline-editor/inline-editor.component';
import { NoctuaEditorDropdownComponent } from './inline-editor/editor-dropdown/editor-dropdown.component';
import { NoctuaReferenceDropdownComponent } from './inline-reference/reference-dropdown/reference-dropdown.component';
import { NoctuaWithDropdownComponent } from './inline-with/with-dropdown/with-dropdown.component';
import { NoctuaDetailDropdownComponent } from './inline-detail/detail-dropdown/detail-dropdown.component';
import { NoctuaEditorStandardDropdownComponent } from './inline-editor/standard-dropdown/standard-dropdown.component';
import { NoctuaAutocompleteModule } from '@noctua.autocomplete/noctua-autocomplete.module';

@NgModule({
    declarations: [
        NoctuaDetailDropdownComponent,
        NoctuaInlineEditorComponent,
        NoctuaEditorDropdownComponent,
        NoctuaReferenceDropdownComponent,
        NoctuaWithDropdownComponent,
        NoctuaEditorStandardDropdownComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        NoctuaSharedModule,
        NoctuaAutocompleteModule,
    ],
    exports: [
        NoctuaDetailDropdownComponent,
        NoctuaInlineEditorComponent,
        NoctuaReferenceDropdownComponent,
        NoctuaWithDropdownComponent,
        NoctuaEditorStandardDropdownComponent
    ]
})
export class NoctuaEditorModule {
}
