import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import expensesReducer from '../store/expensesSlice';
import { AddExpensePage } from '../pages/AddExpensePage';
import { ExpensesPage } from '../pages/ExpensesPage';
import sampleData from '../data/sample-data.json';
import { Member, Expense } from '../types';

function createTestStore() {
  return configureStore({
    reducer: {
      expenses: expensesReducer,
    },
    preloadedState: {
      expenses: {
        members: sampleData.members as Member[],
        expenses: sampleData.expenses as Expense[],
        flashMessage: null,
      },
    },
  });
}

describe('Add Expense Form & Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays validation errors on invalid empty submit', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/expenses/new']}>
          <AddExpensePage />
        </MemoryRouter>
      </Provider>
    );

    const submitBtn = screen.getByRole('button', { name: /save expense/i });
    fireEvent.click(submitBtn);

    // Should display description and amount errors
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
  });

  it('validates amount must be greater than 0 on negative input', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/expenses/new']}>
          <AddExpensePage />
        </MemoryRouter>
      </Provider>
    );

    const descInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/^amount \(in ₹\)$/i);
    const submitBtn = screen.getByRole('button', { name: /save expense/i });

    fireEvent.change(descInput, { target: { value: 'Test Taxi' } });
    fireEvent.change(amountInput, { target: { value: '-250' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/amount must be more than ₹0/i)).toBeInTheDocument();
  });

  it('successfully submits valid expense and navigates to expenses page', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/expenses/new']}>
          <Routes>
            <Route path="/expenses/new" element={<AddExpensePage />} />
            <Route path="/" element={<ExpensesPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const descInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/^amount \(in ₹\)$/i);
    const submitBtn = screen.getByRole('button', { name: /save expense/i });

    fireEvent.change(descInput, { target: { value: 'Goa Kayaking' } });
    fireEvent.change(amountInput, { target: { value: '1500.00' } });
    fireEvent.click(submitBtn);

    // Navigates to ExpensesPage and shows new expense
    expect(screen.getByText('Goa Kayaking')).toBeInTheDocument();
    expect(screen.getByText(/expense added successfully/i)).toBeInTheDocument();
  });
});
