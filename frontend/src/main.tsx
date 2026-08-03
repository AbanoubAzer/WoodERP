import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { toArabicDigits } from './utils/numberUtils.ts';

// Override global formatting to always use Arabic (ar-EG-u-nu-arab) and convert digits to Eastern Arabic (٠-٩)
const originalNumberToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
  const result = originalNumberToLocaleString.call(this, locales || 'ar-EG-u-nu-arab', options);
  return toArabicDigits(result);
};

const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
  const result = originalDateToLocaleDateString.call(this, locales || 'ar-EG-u-nu-arab', options);
  return toArabicDigits(result);
};

const originalDateToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
  const result = originalDateToLocaleString.call(this, locales || 'ar-EG-u-nu-arab', options);
  return toArabicDigits(result);
};

// Global event listener to handle disable & loading state for ALL buttons across the entire app
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const button = target?.closest('button') as HTMLButtonElement | null;

  if (!button || button.disabled || button.getAttribute('data-no-auto-loading') === 'true') {
    return;
  }

  // Visual disable & loading styling
  button.classList.add('is-btn-loading');

  let spinner = button.querySelector('.global-btn-spinner') as HTMLElement;
  if (!spinner) {
    spinner = document.createElement('span');
    spinner.className = 'global-btn-spinner inline-flex items-center justify-center ml-2 shrink-0 animate-spin';
    spinner.innerHTML = `<svg class="w-4 h-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    button.prepend(spinner);
  }

  // Safely apply visual pointer disabled state after click event propagation completes
  setTimeout(() => {
    button.classList.add('pointer-events-none', 'opacity-75');
  }, 50);

  // Restore button state after interaction completes
  setTimeout(() => {
    button.classList.remove('pointer-events-none', 'opacity-75', 'is-btn-loading');
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  }, 500);
}, false);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

