import {Action} from '@ngrx/store';

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
}

/**
 * store transaction des absences action UPSERT
 */
export class Upsert {
  readonly type = UPSERT;

  public constructor() {
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


export type transaction = Fetch | Upsert | EditSuccess | LoadError | Reset | LoadSuccess;
