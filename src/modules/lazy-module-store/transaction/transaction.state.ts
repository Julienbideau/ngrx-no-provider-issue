import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { IAbsencesClass } from '../../models';

/**
 * adaptateur des entités absences
 */
export const absencesAdapter: EntityAdapter<IAbsencesClass> = createEntityAdapter<IAbsencesClass>({
  selectId: (model) => model.seq
});

/**
 * interface du state absences
 */
export interface State extends EntityState<IAbsencesClass> {
  reload: boolean;
  loading: boolean;
}

/**
 * state initial des entités absences
 */
export const initialState: State = {
  reload: false,
  loading: true,
  entities: absencesAdapter.getInitialState().entities,
  ids: absencesAdapter.getInitialState().ids
};
