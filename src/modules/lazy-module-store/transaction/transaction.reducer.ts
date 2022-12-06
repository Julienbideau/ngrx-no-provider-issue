import * as TransactionActions from './transaction.actions';
import { initialState, State } from './transaction.state';

export function TransactionReducer(state: State = initialState, action: TransactionActions.actionabstransaction) {
  switch (action.type) {
    /* rechargement de la transaction
     * */
    case TransactionActions.REFRESH:
      return { ...state, reload: true, loading: true };
    /**
     *
     */
    case TransactionActions.LOAD_SUCCESS:
    case TransactionActions.LOAD_ERROR:
      return { ...state, reload: false, loading: false };
    /**
     * validation globale ou initialisation
     */
    case TransactionActions.VALID_ALL:
    case TransactionActions.FETCH:
      return { ...state, reload: false, loading: true };
    /* state par défaut */
    /* action reset */
    /* state par défaut */
    default:
      return { ...state, reload: false };
  }
}
