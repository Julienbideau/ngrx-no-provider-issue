import {CommonModule} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {StoreComponent} from './store.component';
import {EffectsModule} from '@ngrx/effects';
import {TransactionStoreModule} from "./transaction/transaction-store.module";

/**
 * module du chr-absence
 */
@NgModule({
  declarations: [StoreComponent],
  exports: [StoreComponent],
  imports: [
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    CommonModule,
    FormsModule,
    TransactionStoreModule,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StoreModule {
}
