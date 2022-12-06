import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {IModelClass} from "./i-model.class";

/**
 * adaptateur
 */
export const modelAdapter: EntityAdapter<IModelClass> = createEntityAdapter<IModelClass>({
  selectId: (model) => model.id
});

/**
 * interface
 */
export interface State extends EntityState<IModelClass> {
  reload: boolean;
  loading: boolean;
}

/**
 * state initial
 */
export const initialState: State = {
  reload: false,
  loading: true,
  entities: modelAdapter.getInitialState().entities,
  ids: modelAdapter.getInitialState().ids
};
