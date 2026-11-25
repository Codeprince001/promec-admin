export function naira(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(amount);
}

export function when(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(date);
}

export function titleCase(value: string) {
  return value.replaceAll('_', ' ');
}

export const NEXT_STATUS: Record<string, string[]> = {
  pending_payment: ['paid', 'cancelled', 'payment_failed'],
  payment_failed: ['pending_payment', 'cancelled'],
  paid: ['processing', 'awaiting_stock', 'cancelled'],
  awaiting_stock: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['dispatched'],
  dispatched: ['delivered'],
  delivered: ['completed', 'return_requested'],
  return_requested: ['returned', 'completed'],
  returned: [],
  completed: [],
  cancelled: [],
};

export const IMPORT_STEPS = ['planned', 'booked', 'departed', 'arrived', 'customs', 'cleared', 'delivered'] as const;

export function nextImportStep(current: string) {
  const index = IMPORT_STEPS.indexOf(current as (typeof IMPORT_STEPS)[number]);
  if (index < 0 || index === IMPORT_STEPS.length - 1) return null;
  return IMPORT_STEPS[index + 1];
}
