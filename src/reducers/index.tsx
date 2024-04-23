import { combineReducers } from 'redux';

import requests from './requests';
import history from './history';
import settings from './settings';

const rootReducer = combineReducers({
  requests,
  history,
  settings
});

export type AppRootState = ReturnType<typeof rootReducer>;
export default rootReducer;
