import { formatPaise, rupeesToPaise } from './money';

export interface FormValues {
  description: string;
  amount: string;
  paidBy: string;
  date: string;
  category: string;
  splitType: 'equal' | 'exact' | 'percent';
  selectedMembers: string[];
  exactAmounts: Record<string, string>; // memberId -> rupees string
  percentages: Record<string, string>; // memberId -> percent string
}

export interface ValidationErrors {
  description?: string;
  amount?: string;
  paidBy?: string;
  date?: string;
  category?: string;
  split?: string;
}

export function validateExpenseForm(values: FormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  // 1. Description: required, at most 60 characters
  const trimmedDesc = values.description.trim();
  if (!trimmedDesc) {
    errors.description = 'Description is required';
  } else if (trimmedDesc.length > 60) {
    errors.description = 'Description cannot exceed 60 characters';
  }

  // 2. Amount: required, > ₹0, <= ₹10,00,000, <= 2 decimals
  const amountStr = values.amount.trim();
  if (!amountStr) {
    errors.amount = 'Amount is required';
  } else {
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'Amount must be more than ₹0';
    } else if (amountNum > 1000000) {
      errors.amount = 'Amount cannot exceed ₹10,00,000';
    } else if (amountStr.includes('.') && amountStr.split('.')[1].length > 2) {
      errors.amount = 'Amount cannot have more than 2 decimal places';
    }
  }

  // 3. Paid by: required
  if (!values.paidBy.trim()) {
    errors.paidBy = 'Payer is required';
  }

  // 4. Date: required, cannot be in future
  if (!values.date.trim()) {
    errors.date = 'Date is required';
  } else {
    const today = new Date().toISOString().split('T')[0];
    if (values.date > today) {
      errors.date = 'Date cannot be in the future';
    }
  }

  // 5. Category: required
  if (!values.category.trim()) {
    errors.category = 'Category is required';
  }

  // 6. Split validation
  const totalPaise = rupeesToPaise(values.amount);

  if (values.splitType === 'equal') {
    if (values.selectedMembers.length === 0) {
      errors.split = 'Select at least one member to split with';
    }
  } else if (values.splitType === 'exact') {
    let sumPaise = 0;
    let hasNegative = false;

    for (const [, val] of Object.entries(values.exactAmounts)) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (num < 0) hasNegative = true;
        sumPaise += rupeesToPaise(num);
      }
    }

    if (hasNegative) {
      errors.split = 'Each share must be ₹0 or more';
    } else if (sumPaise !== totalPaise) {
      const diff = totalPaise - sumPaise;
      if (diff > 0) {
        errors.split = `${formatPaise(diff)} left to assign`;
      } else {
        errors.split = `${formatPaise(Math.abs(diff))} over assigned`;
      }
    }
  } else if (values.splitType === 'percent') {
    let sumPercent = 0;
    let hasInvalid = false;

    for (const [, val] of Object.entries(values.percentages)) {
      const trimmed = val.trim();
      if (trimmed) {
        if (trimmed.includes('.') && trimmed.split('.')[1].length > 2) {
          hasInvalid = true;
        }
        const num = parseFloat(trimmed);
        if (isNaN(num) || num < 0 || num > 100) {
          hasInvalid = true;
        } else {
          // Multiply by 100 to avoid float precision errors when summing percentages
          sumPercent += Math.round(num * 100);
        }
      }
    }

    if (hasInvalid) {
      errors.split = 'Each percentage must be between 0 and 100 with at most 2 decimals';
    } else if (sumPercent !== 10000) { // 100.00%
      const actualPct = (sumPercent / 100).toFixed(2);
      errors.split = `Percentages must sum to exactly 100% (currently ${actualPct}%)`;
    }
  }

  return errors;
}
