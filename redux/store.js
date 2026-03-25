import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { apiSlice } from './api/apiSlice';

// Persist auth across page reloads
function loadAuthState() {
  try {
    if (typeof window !== 'undefined') {
      const serialized = localStorage.getItem('auth_user');
      return serialized ? { auth: { user: JSON.parse(serialized), isAuthenticated: true } } : undefined;
    }
  } catch { /* ignore */ }
  return undefined;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  preloadedState: loadAuthState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Save auth user to localStorage on every state change
store.subscribe(() => {
  try {
    const { user } = store.getState().auth;
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  } catch { /* ignore */ }
});
