import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import expensesReducer from './expensesSlice';

const STORAGE_KEY = 'trip_splitter_expenses';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
  },
});

// Sync expenses to localStorage whenever store updates
store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses.expenses));
  } catch {
    // Gracefully ignore storage quota errors in test/private modes
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
