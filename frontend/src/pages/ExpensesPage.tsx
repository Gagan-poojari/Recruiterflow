import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { deleteExpense, clearFlashMessage } from '../store/expensesSlice';
import { calculateBalances } from '../utils/balance';
import { formatPaise } from '../utils/money';
import { getSplitDescription } from '../utils/split';
import { Category } from '../types';

const CATEGORIES: ('All' | Category)[] = ['All', 'Food', 'Travel', 'Stay', 'Activities', 'Other'];

export const ExpensesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { members, expenses, flashMessage } = useAppSelector((state) => state.expenses);

  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Map member ID to member name for quick lookup
  const memberNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.id] = m.name;
    }
    return map;
  }, [members]);

  // Member balances
  const balances = useMemo(() => {
    return calculateBalances(members, expenses);
  }, [members, expenses]);

  // Filtered and sorted expenses (newest date first)
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }
    // Sort newest date first. If same date, preserve newest added first
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [expenses, selectedCategory]);

  // Total of expenses currently shown
  const totalShownPaise = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const confirmDelete = () => {
    if (expenseToDelete) {
      dispatch(deleteExpense(expenseToDelete));
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="page-container">
      {flashMessage && (
        <div className="flash-message" role="alert">
          <span>{flashMessage}</span>
          <button
            type="button"
            className="flash-close"
            onClick={() => dispatch(clearFlashMessage())}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Member Balances Section */}
      <section className="section-card balances-section" aria-labelledby="balances-heading">
        <h2 id="balances-heading" className="section-title">Trip Balances</h2>
        <div className="balances-grid">
          {balances.map((b) => {
            let badgeClass = 'balance-settled';
            if (b.netPaise > 0) badgeClass = 'balance-positive';
            if (b.netPaise < 0) badgeClass = 'balance-negative';

            return (
              <div key={b.memberId} className={`balance-card ${badgeClass}`}>
                <div className="balance-name">{b.name}</div>
                <div className="balance-status">{b.statusText}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Expenses Table & Filter Section */}
      <section className="section-card" aria-labelledby="expenses-heading">
        <div className="expenses-header">
          <div>
            <h2 id="expenses-heading" className="section-title">All Expenses</h2>
            <p className="expenses-subtitle">
              Showing total: <strong>{formatPaise(totalShownPaise)}</strong>
            </p>
          </div>

          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Filter by Category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'All' | Category)}
              className="category-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <p>
              {selectedCategory === 'All'
                ? 'No expenses recorded yet. Start by adding one!'
                : `No expenses found in category "${selectedCategory}".`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Paid By</th>
                  <th scope="col" className="text-right">Amount</th>
                  <th scope="col">Split</th>
                  <th scope="col" className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.date}</td>
                    <td className="font-semibold">{exp.description}</td>
                    <td>
                      <span className={`category-tag cat-${exp.category.toLowerCase()}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td>{memberNameMap[exp.paidBy] ?? exp.paidBy}</td>
                    <td className="text-right font-mono">{formatPaise(exp.amount)}</td>
                    <td className="split-desc">{getSplitDescription(exp.split)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp.id)}
                        className="btn-delete"
                        aria-label={`Delete expense ${exp.description}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-box">
            <h3 id="modal-title" className="modal-title">Confirm Delete</h3>
            <p className="modal-text">Are you sure you want to delete this expense? Balances will update immediately.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setExpenseToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
