export function formatLKR(amount: number | string | undefined | null) {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return 'Rs. 0';
  return `Rs. ${Math.trunc(n).toLocaleString('en-LK')}`;
}
