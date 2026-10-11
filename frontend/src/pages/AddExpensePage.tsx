import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { addExpense } from '../store/expensesSlice';
import { Category, Expense, Split } from '../types';
import { rupeesToPaise, formatPaise } from '../utils/money';
import { validateExpenseForm, FormValues, ValidationErrors } from '../utils/validation';

const CATEGORIES: Category[] = ['Food', 'Travel', 'Stay', 'Activities', 'Other'];

export const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const members = useAppSelector((state) => state.expenses.members);

  const today = new Date().toISOString().split('T')[0];

  const [formValues, setFormValues] = useState<FormValues>({
    description: '',
    amount: '',
    paidBy: members[0]?.id ?? '',
    date: today,
    category: 'Food',
    splitType: 'equal',
    selectedMembers: members.map((m) => m.id),
    exactAmounts: {},
    percentages: {},
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleInputChange = (field: keyof FormValues, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error as user types
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleToggleMember = (memberId: string) => {
    const current = formValues.selectedMembers;
    const next = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    handleInputChange('selectedMembers', next);
  };

  const handleExactAmountChange = (memberId: string, val: string) => {
    setFormValues((prev) => ({
      ...prev,
      exactAmounts: { ...prev.exactAmounts, [memberId]: val },
    }));
    if (errors.split) setErrors((prev) => ({ ...prev, split: undefined }));
  };

  const handlePercentageChange = (memberId: string, val: string) => {
    setFormValues((prev) => ({
      ...prev,
      percentages: { ...prev.percentages, [memberId]: val },
    }));
    if (errors.split) setErrors((prev) => ({ ...prev, split: undefined }));
  };

  // Helper calculation for exact split progress
  const totalEnteredPaise = Object.values(formValues.exactAmounts).reduce((acc, str) => {
    const num = parseFloat(str);
    return !isNaN(num) ? acc + rupeesToPaise(num) : acc;
  }, 0);
  const targetExpensePaise = rupeesToPaise(formValues.amount);
  const exactDiff = targetExpensePaise - totalEnteredPaise;

  // Helper calculation for percent split progress
  const totalEnteredPercent = Object.values(formValues.percentages).reduce((acc, str) => {
    const num = parseFloat(str);
    return !isNaN(num) ? acc + num : acc;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateExpenseForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const amountInPaise = rupeesToPaise(formValues.amount);
    let split: Split;

    if (formValues.splitType === 'equal') {
      split = {
        type: 'equal',
        memberIds: formValues.selectedMembers,
      };
    } else if (formValues.splitType === 'exact') {
      const shares: Record<string, number> = {};
      members.forEach((m) => {
        const val = formValues.exactAmounts[m.id];
        if (val) {
          const paise = rupeesToPaise(val);
          if (paise > 0) shares[m.id] = paise;
        }
      });
      split = {
        type: 'exact',
        shares,
      };
    } else {
      const shares: Record<string, number> = {};
      members.forEach((m) => {
        const val = formValues.percentages[m.id];
        if (val) {
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0) shares[m.id] = num;
        }
      });
      split = {
        type: 'percent',
        shares,
      };
    }

    const newExpense: Expense = {
      id: `e_${Date.now()}`,
      description: formValues.description.trim(),
      amount: amountInPaise,
      paidBy: formValues.paidBy,
      date: formValues.date,
      category: formValues.category as Category,
      split,
    };

    dispatch(addExpense(newExpense));
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="section-card form-container">
        <h2 className="section-title">Add New Expense</h2>

        <form onSubmit={handleSubmit} noValidate className="expense-form">
          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="text-muted">(max 60 characters)</span>
            </label>
            <input
              id="description"
              type="text"
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              placeholder="e.g. Scuba diving, Villa rental"
              value={formValues.description}
              maxLength={60}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
            {errors.description && <span className="field-error" role="alert">{errors.description}</span>}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (in ₹)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="1000000"
              className={`form-input ${errors.amount ? 'input-error' : ''}`}
              placeholder="e.g. 1500.50"
              value={formValues.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
            {errors.amount && <span className="field-error" role="alert">{errors.amount}</span>}
          </div>

          {/* Paid By */}
          <div className="form-group">
            <label htmlFor="paidBy" className="form-label">
              Paid by
            </label>
            <select
              id="paidBy"
              className={`form-input ${errors.paidBy ? 'input-error' : ''}`}
              value={formValues.paidBy}
              onChange={(e) => handleInputChange('paidBy', e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.paidBy && <span className="field-error" role="alert">{errors.paidBy}</span>}
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Date <span className="text-muted">(cannot be in the future)</span>
            </label>
            <input
              id="date"
              type="date"
              max={today}
              className={`form-input ${errors.date ? 'input-error' : ''}`}
              value={formValues.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
            {errors.date && <span className="field-error" role="alert">{errors.date}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              className={`form-input ${errors.category ? 'input-error' : ''}`}
              value={formValues.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <span className="field-error" role="alert">{errors.category}</span>}
          </div>

          {/* Split Type Selector */}
          <div className="form-group">
            <fieldset className="split-fieldset">
              <legend className="form-label">Split Method</legend>
              <div className="radio-tabs">
                <label className={`radio-tab ${formValues.splitType === 'equal' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="splitType"
                    value="equal"
                    checked={formValues.splitType === 'equal'}
                    onChange={() => handleInputChange('splitType', 'equal')}
                  />
                  <span>Equally</span>
                </label>
                <label className={`radio-tab ${formValues.splitType === 'exact' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="splitType"
                    value="exact"
                    checked={formValues.splitType === 'exact'}
                    onChange={() => handleInputChange('splitType', 'exact')}
                  />
                  <span>Exact Amounts</span>
                </label>
                <label className={`radio-tab ${formValues.splitType === 'percent' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="splitType"
                    value="percent"
                    checked={formValues.splitType === 'percent'}
                    onChange={() => handleInputChange('splitType', 'percent')}
                  />
                  <span>Percentages</span>
                </label>
              </div>
            </fieldset>
          </div>

          {/* Dynamic Split Sub-Inputs */}
          <div className="split-details-box">
            {formValues.splitType === 'equal' && (
              <fieldset>
                <legend className="split-sub-title">Select members who share this expense:</legend>
                <div className="members-checkbox-grid">
                  {members.map((m) => (
                    <label key={m.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formValues.selectedMembers.includes(m.id)}
                        onChange={() => handleToggleMember(m.id)}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {formValues.splitType === 'exact' && (
              <fieldset>
                <legend className="split-sub-title">Enter exact amount in ₹ for each member:</legend>
                <div className="split-inputs-list">
                  {members.map((m) => (
                    <div key={m.id} className="split-input-row">
                      <label htmlFor={`exact-${m.id}`} className="split-member-label">{m.name}</label>
                      <input
                        id={`exact-${m.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="₹ 0.00"
                        className="form-input form-input-sm"
                        value={formValues.exactAmounts[m.id] ?? ''}
                        onChange={(e) => handleExactAmountChange(m.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                {targetExpensePaise > 0 && (
                  <div className={`split-status-hint ${exactDiff !== 0 ? 'text-amber' : 'text-green'}`}>
                    {exactDiff > 0 && `${formatPaise(exactDiff)} left to assign`}
                    {exactDiff < 0 && `${formatPaise(Math.abs(exactDiff))} over assigned`}
                    {exactDiff === 0 && `✓ Exact amounts match total expense perfectly`}
                  </div>
                )}
              </fieldset>
            )}

            {formValues.splitType === 'percent' && (
              <fieldset>
                <legend className="split-sub-title">Enter percentage share for each member (%):</legend>
                <div className="split-inputs-list">
                  {members.map((m) => (
                    <div key={m.id} className="split-input-row">
                      <label htmlFor={`percent-${m.id}`} className="split-member-label">{m.name}</label>
                      <input
                        id={`percent-${m.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0%"
                        className="form-input form-input-sm"
                        value={formValues.percentages[m.id] ?? ''}
                        onChange={(e) => handlePercentageChange(m.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className={`split-status-hint ${totalEnteredPercent !== 100 ? 'text-amber' : 'text-green'}`}>
                  Total: {totalEnteredPercent.toFixed(2)}% / 100%
                </div>
              </fieldset>
            )}

            {errors.split && <span className="field-error" role="alert">{errors.split}</span>}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
