/**
 * Money utilities for Trip Splitter.
 * All monetary amounts are stored internally as integer paise to avoid IEEE 754 float drift.
 */

export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats integer paise into Indian currency format (e.g. ₹1,00,000.00).
 */
export function formatPaise(paise: number): string {
  const rupees = Math.abs(paise) / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);

  return paise < 0 ? `-${formatted}` : formatted;
}
