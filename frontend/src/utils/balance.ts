import { Member, Expense, MemberBalance } from '../types';
import { calculateExpenseShares } from './split';
import { formatPaise } from './money';

/**
 * Calculates net balance for every member.
 * Formula: Net = (Total Paid) - (Total Owed)
 * - Net > 0: "gets back ₹X"
 * - Net < 0: "owes ₹X"
 * - Net === 0: "settled up"
 * Invariant: Sum of all net balances across members always equals 0.
 */
export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  const paidMap: Record<string, number> = {};
  const owedMap: Record<string, number> = {};

  for (const m of members) {
    paidMap[m.id] = 0;
    owedMap[m.id] = 0;
  }

  for (const exp of expenses) {
    if (paidMap[exp.paidBy] !== undefined) {
      paidMap[exp.paidBy] += exp.amount;
    }

    const shares = calculateExpenseShares(exp);
    for (const [memberId, paise] of Object.entries(shares)) {
      if (owedMap[memberId] !== undefined) {
        owedMap[memberId] += paise;
      }
    }
  }

  return members.map((m) => {
    const net = (paidMap[m.id] ?? 0) - (owedMap[m.id] ?? 0);
    let statusText = 'settled up';
    if (net > 0) {
      statusText = `gets back ${formatPaise(net)}`;
    } else if (net < 0) {
      statusText = `owes ${formatPaise(Math.abs(net))}`;
    }

    return {
      memberId: m.id,
      name: m.name,
      netPaise: net,
      statusText,
    };
  });
}
