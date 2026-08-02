import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override global formatting to always use Arabic (ar-EG) for numbers and dates
const originalNumberToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
  return originalNumberToLocaleString.call(this, 'ar-EG', options);
};

const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
  return originalDateToLocaleDateString.call(this, 'ar-EG', options);
};

const originalDateToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
  return originalDateToLocaleString.call(this, 'ar-EG', options);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
