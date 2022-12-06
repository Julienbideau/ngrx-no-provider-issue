import * as TransactionActions from './transaction.actions';
import {initialState, State} from './transaction.state';

export function TransactionReducer(state: State = initialState, action: TransactionActions.transaction) {
  switch (action.type) {

    /**
     *
     */
    case TransactionActions.LOAD_SUCCESS:
    case TransactionActions.LOAD_ERROR:
      return {...state, reload: false, loading: false};
    case TransactionActions.FETCH:
      return {...state, reload: false, loading: true};
    /* state par défaut */
    /* action reset */
    /* state par défaut */
    default:
      return {...state, reload: false};
  }
}
