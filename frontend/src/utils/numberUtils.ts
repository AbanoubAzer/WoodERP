/**
 * Converts any ASCII digits (0-9) in a string or number to Eastern Arabic numerals (٠-٩).
 */
export function toArabicDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
}

/**
 * Formats a number with thousands separators using Eastern Arabic numerals.
 */
export function formatArabicNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '٠';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '٠';
  
  const formatted = num.toLocaleString('ar-EG-u-nu-arab');
  return toArabicDigits(formatted);
}

/**
 * Formats a currency amount with currency symbol in Eastern Arabic numerals.
 */
export function formatArabicCurrency(value: number | string | null | undefined, currency: string = 'ج.م'): string {
  const formattedNumber = formatArabicNumber(value);
  return `${formattedNumber} ${currency}`;
}

/**
 * Formats a date or date string into Arabic locale date format with Eastern Arabic numerals.
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const formatted = d.toLocaleDateString('ar-EG-u-nu-arab', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return toArabicDigits(formatted);
}
