export interface Member {
  id: string;
  name: string;
}

export type Category = 'Food' | 'Travel' | 'Stay' | 'Activities' | 'Other';

export interface EqualSplit {
  type: 'equal';
  memberIds: string[];
}

export interface ExactSplit {
  type: 'exact';
  shares: Record<string, number>; // in paise
}

export interface PercentSplit {
  type: 'percent';
  shares: Record<string, number>; // in percentage points, e.g. 33.33
}

export type Split = EqualSplit | ExactSplit | PercentSplit;

export interface Expense {
  id: string;
  description: string;
  amount: number; // in paise (integer)
  paidBy: string; // member id
  date: string; // YYYY-MM-DD
  category: Category;
  split: Split;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  netPaise: number; // positive = gets back, negative = owes, 0 = settled up
  statusText: string;
}
