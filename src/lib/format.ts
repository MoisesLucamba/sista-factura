// Formatting utilities for Angolan currency and dates

/**
 * Format a number as Angolan Kwanza (AOA)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('AOA', 'Kz');
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date in Portuguese (Angola) format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format NIF (Número de Identificação Fiscal)
 */
export function formatNIF(nif: string): string {
  // Remove non-numeric characters
  const cleaned = nif.replace(/\D/g, '');
  // Format as XXX XXX XXX
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

/**
 * Validate Angolan NIF
 */
export function validateNIF(nif: string): boolean {
  const cleaned = nif.replace(/\D/g, '');
  return cleaned.length === 9 && /^\d+$/.test(cleaned);
}

/**
 * Generate sequential invoice number
 */
export function generateInvoiceNumber(serie: string, sequencial: number): string {
  const year = new Date().getFullYear();
  const seq = sequencial.toString().padStart(6, '0');
  return `${serie}/${year}/${seq}`;
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month];
}

/**
 * Calculate VAT amount
 */
export function calculateIVA(subtotal: number, rate: number = 14): number {
  return subtotal * (rate / 100);
}

/**
 * Calculate total with VAT
 */
export function calculateTotalWithIVA(subtotal: number, rate: number = 14): number {
  return subtotal + calculateIVA(subtotal, rate);
}
