/**
 * Formats a number into Indian shorthand (Crores/Lakhs)
 * Example: 1500,00,00,000 -> ₹1500.00 Cr
 *          15,00,000      -> ₹15.00 Lakh
 */
export const formatCurrency = (val) => {
  if (val === null || val === undefined) return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};
