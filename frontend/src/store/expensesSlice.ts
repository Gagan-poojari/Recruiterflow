import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Member, Expense } from '../types';
import sampleData from '../data/sample-data.json';

const STORAGE_KEY = 'trip_splitter_expenses';

function loadInitialExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Expense[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // If corrupt or unavailable, safely fall back to sample data
  }
  return sampleData.expenses as Expense[];
}

interface ExpensesState {
  members: Member[];
  expenses: Expense[];
  flashMessage: string | null;
}

const initialState: ExpensesState = {
  members: sampleData.members as Member[],
  expenses: loadInitialExpenses(),
  flashMessage: null,
};

export const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload);
      state.flashMessage = 'Expense added successfully!';
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      state.flashMessage = 'Expense deleted successfully!';
    },
    clearFlashMessage: (state) => {
      state.flashMessage = null;
    },
  },
});

export const { addExpense, deleteExpense, clearFlashMessage } = expensesSlice.actions;
export default expensesSlice.reducer;
