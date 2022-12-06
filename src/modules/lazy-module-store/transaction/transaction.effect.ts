import { Injectable } from '@angular/core';
import { Actions, createEffect, Effect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as actionabstransaction from './transaction.actions';
import * as actionTypAbs from '../typabs/typabs.actions';
import * as actionAbsPeriode from '../absenceperiode/absenceperiode.actions';
import * as actionAbsHeure from '../absenceheure/absenceheure.actions';
import { of } from 'rxjs';
import { ChrAbsenceProvider } from '../../chr-absence.provider';
import { IAbsencesClass, IChrCtxabsClass } from '../../models';
import { AbsencesStoreTools } from '../tools';
import { ChrGetMsgPipe } from 'src/modules/chronos-core/pipes';
import { SaveManager } from 'src/modules/chronos-core/services';
import { HttpAbsencesResponse, ChrReturn } from 'src/modules/common/classes';
import { ReturnType } from 'src/modules/common/enums';
import { ChrMessagesManager, ChrEmail } from 'src/modules/object-html/chr-messages-manager';
import { Action } from '@ngrx/store';

@Injectable()
export class TransactionEffect {
  public constructor(
    private readonly actions$: Actions,
    private readonly provider: ChrAbsenceProvider,
    private readonly saveManager: SaveManager,
    private readonly messageManager: ChrMessagesManager,
    private readonly getMsg: ChrGetMsgPipe
  ) {}

  /**
   * effect de l'action UPSERT store absences
   *
   * ajout/modif d'une absence
   *
   */
  upsert$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actionabstransaction.UPSERT),
      map((action: actionabstransaction.Upsert) => {
        if (this.saveManager) {
          this.saveManager.update(action.payload.absence.seq, action.payload.absence);
        }

        return new actionabstransaction.EditSuccess();
      })
    );
  });

  /**
   * effect de l'action FETCH store absences
   *
   * récupération du paramétrage des motifs d'absences
   *
   * récpération des absences périodes
   *
   * récpération des absences heures
   *
   */
  fetch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actionabstransaction.FETCH),
      map((action: actionabstransaction.Fetch) => action.payload.contexte),
      switchMap((ctxAbsence: IChrCtxabsClass) =>
        this.provider.getAllAbsences(ctxAbsence).pipe(catchError(() => of(new actionabstransaction.LoadError())))
      ),
      switchMap((response: HttpAbsencesResponse) => {
        const actions: Action[] = [];
        if (response.parabs) {
          actions.push(new actionTypAbs.Load(response.parabs));
        }
        if (response.absp) {
          actions.push(new actionAbsPeriode.Load(response.absp));
        } else {
          actions.push(new actionAbsPeriode.Load([]));
        }
        if (response.absh) {
          actions.push(new actionAbsHeure.Load(response.absh));
        } else {
          actions.push(new actionAbsHeure.Load([]));
        }
        actions.push(new actionabstransaction.LoadSuccess());
        return actions;
      })
    );
  });

  /**
   * effect de l'action RESET store absences
   *
   * effect non utilisé
   *
   * pour CANCEL
   *
   */
  cancel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actionabstransaction.RESET),
      map((action: actionabstransaction.Reset) => {
        if (this.saveManager) {
          this.saveManager.clear();
        }
        // Fixme: ça fait quoi ??
        new actionAbsPeriode.Reset(action.payload.absences.filter((abs) => !abs.isHoraire));
        new actionAbsHeure.Reset(action.payload.absences.filter((abs) => abs.isHoraire));
        return new actionabstransaction.EditSuccess();
      })
    );
  });

  /**
   * effect de l'action VALID_ALL store absences
   *
   * validation globale des absences
   *
   * avec envoi de mail
   *
   */
  private mail: boolean = true;
  private envoiMail: string = '0';
  private absToSave: IAbsencesClass[] = [];
  validAll$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actionabstransaction.VALID_ALL),
      map((action: actionabstransaction.ValidAll) => {
        this.mail = action.payload.mail;
        this.envoiMail = action.payload.envoiMail;
        this.absToSave = action.payload.absences;
        this.messageManager.snackBar({
          interfaceColor: 'abs',
          message: this.getMsg.transform('Traitement en cours', ''),
          returns: [],
          mode: 'info'
        });
        return action.payload.absences;
      }),
      switchMap((absences: IAbsencesClass[]) =>
        this.provider
          .valideAbs(AbsencesStoreTools.getExtraPram(this.mail), AbsencesStoreTools.getAbsencesToValid(absences))
          .pipe(catchError(() => of(new actionabstransaction.LoadError())))
      ),
      switchMap((response: ChrReturn[]) => {
        const returnMails: ChrReturn[] = response.filter((r) => r.ret === ReturnType.MAIL);
        const actions: Action[] = [];
        if (returnMails.length > 0) {
          this.provider.getEmail(returnMails).subscribe((message: ChrEmail[]) => {
            this.messageManager
              .mail({
                mail: message[0],
                interfaceColor: 'abs',
                mode: 'mail'
              })
              .subscribe((email: ChrEmail) => {
                this.provider.sendMail(message[0], returnMails).subscribe((ret: ChrReturn[]) => {
                  const errors: ChrReturn[] = ret.filter((r) => r.ret === ReturnType.ERROR);
                  if (errors) {
                    this.messageManager.snackBar({ interfaceColor: 'abs', message: errors[0].mes, returns: errors });
                  }
                });
              });
          });
        } else {
          if (this.envoiMail === '2') {
            this.messageManager.snackBar({
              interfaceColor: 'abs',
              message:
                this.absToSave.length === 1
                  ? this.getMsg.transform('E-mail envoyé', '')
                  : this.getMsg.transform('E-mails envoyés', ''),
              returns: [],
              mode: 'success'
            });
          }
        }

        actions.push(new actionAbsPeriode.UpsertMultiple(this.absToSave.filter((r) => !r.isHoraire)));
        actions.push(new actionAbsHeure.UpsertMultiple(this.absToSave.filter((r) => r.isHoraire)));
        if (this.saveManager) {
          this.saveManager.clear();
        }
        actions.push(new actionabstransaction.Refresh(this.absToSave));
        return actions;
      })
    );
  });
}
