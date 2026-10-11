import { describe, it, expect } from 'vitest';
import { rupeesToPaise, paiseToRupees, formatPaise } from '../utils/money';
import { calculateExpenseShares, getSplitDescription } from '../utils/split';
import { calculateBalances } from '../utils/balance';
import { validateExpenseForm, FormValues } from '../utils/validation';
import { Member, Expense } from '../types';

describe('Money Utilities', () => {
  it('converts rupees string to integer paise without float drift', () => {
    expect(rupeesToPaise('1250.50')).toBe(125050);
    expect(rupeesToPaise('100')).toBe(10000);
    expect(rupeesToPaise('0.01')).toBe(1);
    expect(rupeesToPaise(100.33)).toBe(10033);
  });

  it('converts paise to rupees', () => {
    expect(paiseToRupees(125050)).toBe(1250.5);
  });

  it('formats paise in Indian numbering format', () => {
    const formatted = formatPaise(10000000); // 1,00,000 rupees
    expect(formatted).toContain('1,00,000.00');
  });
});

describe('Split Calculations (Zero-loss Guarantee)', () => {
  it('splits ₹100 equally between 3 people into 33.34, 33.33, 33.33 with zero paise lost', () => {
    const expense: Expense = {
      id: 'e_test',
      description: 'Test Dinner',
      amount: 10000, // ₹100 in paise
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      split: {
        type: 'equal',
        memberIds: ['m1', 'm2', 'm3'],
      },
    };

    const shares = calculateExpenseShares(expense);
    expect(shares['m1']).toBe(3334); // ₹33.34
    expect(shares['m2']).toBe(3333); // ₹33.33
    expect(shares['m3']).toBe(3333); // ₹33.33

    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(sum).toBe(10000); // Exactly ₹100.00
  });

  it('splits exact amounts properly', () => {
    const expense: Expense = {
      id: 'e_exact',
      description: 'Exact split test',
      amount: 75000,
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Activities',
      split: {
        type: 'exact',
        shares: { m1: 50000, m2: 25000 },
      },
    };

    const shares = calculateExpenseShares(expense);
    expect(shares['m1']).toBe(50000);
    expect(shares['m2']).toBe(25000);
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(75000);
  });

  it('splits percentages without losing a paisa', () => {
    const expense: Expense = {
      id: 'e_pct',
      description: 'Percent split test',
      amount: 149999, // ₹1499.99
      paidBy: 'm1',
      date: '2026-03-15',
      category: 'Travel',
      split: {
        type: 'percent',
        shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
      },
    };

    const shares = calculateExpenseShares(expense);
    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(sum).toBe(149999);
  });

  it('provides readable split descriptions', () => {
    expect(getSplitDescription({ type: 'equal', memberIds: ['m1', 'm2', 'm3', 'm4'] })).toBe('Equally, 4 people');
  });
});

describe('Balance Calculations (Zero-sum Invariant)', () => {
  const members: Member[] = [
    { id: 'm1', name: 'Aarav' },
    { id: 'm2', name: 'Diya' },
    { id: 'm3', name: 'Kabir' },
  ];

  it('payer does not have to be part of the split, and sum of all balances equals exactly 0', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Groceries for others',
        amount: 30000, // ₹300
        paidBy: 'm1', // Aarav pays, but only Diya and Kabir split
        date: '2026-03-12',
        category: 'Food',
        split: {
          type: 'equal',
          memberIds: ['m2', 'm3'],
        },
      },
    ];

    const balances = calculateBalances(members, expenses);
    const aarav = balances.find((b) => b.memberId === 'm1');
    const diya = balances.find((b) => b.memberId === 'm2');
    const kabir = balances.find((b) => b.memberId === 'm3');

    expect(aarav?.netPaise).toBe(30000); // Gets back ₹300
    expect(aarav?.statusText).toContain('gets back');
    expect(diya?.netPaise).toBe(-15000); // Owes ₹150
    expect(diya?.statusText).toContain('owes');
    expect(kabir?.netPaise).toBe(-15000); // Owes ₹150

    // Zero-sum invariant check
    const totalNet = balances.reduce((acc, b) => acc + b.netPaise, 0);
    expect(totalNet).toBe(0);
  });
});

describe('Validation Logic', () => {
  const validValues: FormValues = {
    description: 'Dinner at shack',
    amount: '300.00',
    paidBy: 'm1',
    date: '2026-03-12',
    category: 'Food',
    splitType: 'equal',
    selectedMembers: ['m1', 'm2'],
    exactAmounts: {},
    percentages: {},
  };

  it('passes on valid input', () => {
    const errors = validateExpenseForm(validValues);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('catches empty and overlong description', () => {
    const emptyErrors = validateExpenseForm({ ...validValues, description: '' });
    expect(emptyErrors.description).toBe('Description is required');

    const longErrors = validateExpenseForm({ ...validValues, description: 'a'.repeat(61) });
    expect(longErrors.description).toBe('Description cannot exceed 60 characters');
  });

  it('validates amount boundaries and negative numbers', () => {
    const negErrors = validateExpenseForm({ ...validValues, amount: '-50' });
    expect(negErrors.amount).toBe('Amount must be more than ₹0');

    const highErrors = validateExpenseForm({ ...validValues, amount: '1000001' });
    expect(highErrors.amount).toBe('Amount cannot exceed ₹10,00,000');

    const decimalErrors = validateExpenseForm({ ...validValues, amount: '10.555' });
    expect(decimalErrors.amount).toBe('Amount cannot have more than 2 decimal places');
  });

  it('catches future date', () => {
    const futureDate = '2099-01-01';
    const errors = validateExpenseForm({ ...validValues, date: futureDate });
    expect(errors.date).toBe('Date cannot be in the future');
  });

  it('validates exact amount mismatch showing left or over amount', () => {
    const exactValues: FormValues = {
      ...validValues,
      amount: '100.00',
      splitType: 'exact',
      exactAmounts: { m1: '50.00', m2: '37.50' }, // 87.50, diff is 12.50
    };

    const errors = validateExpenseForm(exactValues);
    expect(errors.split).toContain('left to assign');
  });

  it('validates percentage mismatch', () => {
    const percentValues: FormValues = {
      ...validValues,
      amount: '100.00',
      splitType: 'percent',
      percentages: { m1: '50', m2: '40' }, // 90%
    };

    const errors = validateExpenseForm(percentValues);
    expect(errors.split).toContain('Percentages must sum to exactly 100%');
  });
});
