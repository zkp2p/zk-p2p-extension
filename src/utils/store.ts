import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';

function configureAppStore() {
  const middleware = (getDefaultMiddleware: any) => getDefaultMiddleware().concat(
    process.env.NODE_ENV === 'development' && createLogger({ collapsed: true })
  );

  return configureStore({
    reducer: rootReducer,
    middleware,
  });
}

const store = configureAppStore();

export default store;
