import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map} from "rxjs";
import {EditSuccess, UPSERT} from "./transaction.actions";

@Injectable()
export class TransactionEffect {
  public constructor(
    private readonly actions$: Actions
  ) {
  }

  /**
   * effect de l'action UPSERT store
   *
   * ajout/modif d'une absence
   *
   */
  upsert$ = createEffect(() =>
    this.actions$.pipe(ofType(UPSERT),
      map((action) => new EditSuccess()))
  );
}
