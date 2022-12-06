import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {TransactionEffect} from './transaction.effect';
import {TransactionReducer} from './transaction.reducer';

/**
 * module du store de transaction des absences
 *
 * transaction chr-absence
 *
 */
@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('transaction', TransactionReducer),
    EffectsModule.forFeature([TransactionEffect])
  ],
  providers: [TransactionEffect]
})
export class TransactionStoreModule {
}
