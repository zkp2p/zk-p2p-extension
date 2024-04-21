import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import rootReducer from '../reducers';

function configureAppStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      process.env.NODE_ENV === 'development'
        ? getDefaultMiddleware().concat(
            createLogger({
              collapsed: true,
            }),
          )
        : getDefaultMiddleware(),
  });

  return store;
}

const store = configureAppStore();

export default store;
export type AppDispatch = typeof store.dispatch;
