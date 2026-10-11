import { Expense, Split } from '../types';

/**
 * Calculates how much each member owes for an expense in integer paise.
 * Guaranteed: Sum of returned paise shares equals expense.amount exactly.
 * Rule for extra paise: Remainder paise are allocated +1 paisa to members in list order.
 */
export function calculateExpenseShares(expense: Expense): Record<string, number> {
  const result: Record<string, number> = {};
  const totalPaise = expense.amount;
  const split: Split = expense.split;

  if (split.type === 'equal') {
    const memberIds = split.memberIds;
    const count = memberIds.length;
    if (count === 0) return result;

    const baseShare = Math.floor(totalPaise / count);
    const remainder = totalPaise % count;

    memberIds.forEach((id, index) => {
      // First 'remainder' members get +1 extra paisa
      const extra = index < remainder ? 1 : 0;
      result[id] = baseShare + extra;
    });
  } else if (split.type === 'exact') {
    for (const [memberId, paise] of Object.entries(split.shares)) {
      result[memberId] = paise;
    }
  } else if (split.type === 'percent') {
    const entries = Object.entries(split.shares);
    let assigned = 0;

    // Floor each share calculation
    entries.forEach(([memberId, pct]) => {
      const share = Math.floor((pct / 100) * totalPaise);
      result[memberId] = share;
      assigned += share;
    });

    // Distribute remainder paise one by one to ensure exact total
    let remainder = totalPaise - assigned;
    let idx = 0;
    while (remainder > 0 && entries.length > 0) {
      const [memberId] = entries[idx % entries.length];
      result[memberId] = (result[memberId] ?? 0) + 1;
      remainder--;
      idx++;
    }
  }

  return result;
}

/**
 * Helper to display human-readable split description in table (e.g. "Equally, 4 people").
 */
export function getSplitDescription(split: Split): string {
  if (split.type === 'equal') {
    const count = split.memberIds.length;
    return `Equally, ${count} ${count === 1 ? 'person' : 'people'}`;
  }
  if (split.type === 'exact') {
    const count = Object.keys(split.shares).length;
    return `Exact, ${count} ${count === 1 ? 'person' : 'people'}`;
  }
  if (split.type === 'percent') {
    const count = Object.keys(split.shares).length;
    return `Percentages, ${count} ${count === 1 ? 'person' : 'people'}`;
  }
  return '';
}
