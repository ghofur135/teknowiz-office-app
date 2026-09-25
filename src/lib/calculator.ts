import { DocumentItem } from './types';
export { formatRupiah } from './terbilang';

export interface CalculationInput {
  items: Array<{
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }>;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  tax_rate: number;             // PPN misal 11 atau 12 (%)
  withholding_tax_rate: number; // PPh 23 misal 2 (%)
  paid_amount?: number;
}

export interface CalculationResult {
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  withholding_tax_amount: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
}

export function calculateDocumentFinancials(input: CalculationInput): CalculationResult {
  // 1. Subtotal = sum(qty * unit_price - item_discount)
  let subtotal = 0;
  for (const item of input.items) {
    const itemTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount_amount) || 0);
    subtotal += Math.max(0, itemTotal);
  }

  // 2. Diskon Global
  let discount_amount = 0;
  const discountVal = Number(input.discount_value) || 0;
  if (input.discount_type === 'PERCENT') {
    discount_amount = (subtotal * discountVal) / 100;
  } else {
    discount_amount = discountVal;
  }
  discount_amount = Math.min(subtotal, Math.max(0, discount_amount));

  // 3. Taxable Amount (DPP)
  const taxable_amount = Math.max(0, subtotal - discount_amount);

  // 4. PPN Amount
  const taxRate = Number(input.tax_rate) || 0;
  const tax_amount = (taxable_amount * taxRate) / 100;

  // 5. PPh 23 Withholding Tax Amount
  const withholdingRate = Number(input.withholding_tax_rate) || 0;
  const withholding_tax_amount = (taxable_amount * withholdingRate) / 100;

  // 6. Grand Total
  const grand_total = taxable_amount + tax_amount - withholding_tax_amount;

  // 7. Balance Due
  const paid_amount = Number(input.paid_amount) || 0;
  const balance_due = Math.max(0, grand_total - paid_amount);

  return {
    subtotal: Math.round(subtotal),
    discount_amount: Math.round(discount_amount),
    taxable_amount: Math.round(taxable_amount),
    tax_amount: Math.round(tax_amount),
    withholding_tax_amount: Math.round(withholding_tax_amount),
    grand_total: Math.round(grand_total),
    paid_amount: Math.round(paid_amount),
    balance_due: Math.round(balance_due),
  };
}
