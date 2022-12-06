import { Action } from '@ngrx/store';
import { IAbsencesClass, IChrCtxabsClass } from '../../models/index';

export const FETCH = '[TRANSACTION] Fetch';
export const LOAD_ERROR = '[TRANSACTION] Load Error';
export const UPSERT = '[TRANSACTION] Upsert';
export const EDIT_SUCCESS = '[TRANSACTION] Edit Succes';
export const RESET = '[TRANSACTION] Reset';
export const VALID_ALL = '[TRANSACTION] Valid All';
export const REFRESH = '[TRANSACTION] Refresh';
export const LOAD_SUCCESS = '[TRANSACTION] Load Success';

/**
 * store transaction des absences action FETCH : chargemnt des données
 */
export class Fetch implements Action {
  readonly type = FETCH;
  public payload: { contexte: IChrCtxabsClass };

  constructor(contexte: IChrCtxabsClass) {
    this.payload = { contexte };
  }
}

/**
 * store transaction des absences action UPSERT
 */
export class Upsert {
  readonly type = UPSERT;
  public payload: { absence: IAbsencesClass };

  public constructor(absence: IAbsencesClass) {
    this.payload = { absence };
  }
}

/**
 * store transaction des absences action LOAD_ERROR
 */
export class LoadError implements Action {
  readonly type = LOAD_ERROR;
  public payload: {};

  constructor() {
    this.payload = {};
  }
}

/**
 * store transaction des absences action EDIT_SUCCESS
 */
export class EditSuccess implements Action {
  public readonly type = EDIT_SUCCESS;
  public payload: {};

  public constructor() {
    this.payload = {};
  }
}

/**
 * store transaction des absences action RESET : annulation
 */
export class Reset implements Action {
  readonly type = RESET;
  public payload: { absences: IAbsencesClass[] };

  public constructor(absences: IAbsencesClass[]) {
    this.payload = { absences };
  }
}

/**
 * store transaction des absences action VALID_ALL : validation globale
 */
export class ValidAll implements Action {
  readonly type = VALID_ALL;
  public payload: { absences: IAbsencesClass[]; niveau: string | number; mail: boolean; envoiMail: string };

  public constructor(absences: IAbsencesClass[], niveau: string | number, mail: boolean, envoiMail: string) {
    this.payload = { absences, niveau, mail, envoiMail };
  }
}

/**
 * rechargement après validation
 */
export class Refresh implements Action {
  readonly type = REFRESH;
  public payload: { absences: IAbsencesClass[] };

  constructor(absences: IAbsencesClass[]) {
    this.payload = { absences };
  }
}

/**
 * fetch successed
 */
export class LoadSuccess implements Action {
  public readonly type = LOAD_SUCCESS;
  public payload: {};

  public constructor() {
    this.payload = {};
  }
}

/**
 * export des actions store transaction des absences
 */
export type actionabstransaction = Fetch | Upsert | EditSuccess | LoadError | Reset | ValidAll | Refresh | LoadSuccess;
