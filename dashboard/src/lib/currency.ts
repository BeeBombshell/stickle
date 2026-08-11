export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'BRL' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  proPrice: number;
  teamsPrice: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', proPrice: 29, teamsPrice: 9 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', proPrice: 27, teamsPrice: 8 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', proPrice: 24, teamsPrice: 7 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', proPrice: 2399, teamsPrice: 749 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', proPrice: 39, teamsPrice: 12 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', proPrice: 44, teamsPrice: 14 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', proPrice: 149, teamsPrice: 45 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', proPrice: 4200, teamsPrice: 1300 },
};

const TIMEZONE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'Europe/London': 'GBP',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Athens': 'EUR',
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Sao_Paulo': 'BRL',
  'Asia/Kolkata': 'INR',
  'Asia/Calcutta': 'INR',
  'Asia/Tokyo': 'JPY',
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
};

const LOCALE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'en-GB': 'GBP',
  'en-US': 'USD',
  'en-CA': 'CAD',
  'en-AU': 'AUD',
  'en-IN': 'INR',
  'hi-IN': 'INR',
  'ja-JP': 'JPY',
  'pt-BR': 'BRL',
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
  'es-ES': 'EUR',
  'it-IT': 'EUR',
  'nl-NL': 'EUR',
};

const PREFERRED_CURRENCY_KEY = 'stickle_preferred_currency';

export function detectUserCurrency(): CurrencyCode {
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
    try {
      const saved = localStorage.getItem(PREFERRED_CURRENCY_KEY) as CurrencyCode | null;
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        return saved;
      }
    } catch {}
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && TIMEZONE_CURRENCY_MAP[timeZone]) {
      return TIMEZONE_CURRENCY_MAP[timeZone];
    }

    if (timeZone.startsWith('Europe/')) return 'EUR';
    if (timeZone.startsWith('America/')) return 'USD';
    if (timeZone.startsWith('Asia/Tokyo')) return 'JPY';
    if (timeZone.startsWith('Asia/Kolkata') || timeZone.startsWith('Asia/Calcutta')) return 'INR';
    if (timeZone.startsWith('Australia/')) return 'AUD';
  } catch {}

  try {
    if (typeof navigator !== 'undefined') {
      const languages = navigator.languages || [navigator.language];
      for (const lang of languages) {
        if (LOCALE_CURRENCY_MAP[lang]) {
          return LOCALE_CURRENCY_MAP[lang];
        }
      }
    }
  } catch {}

  return 'USD';
}

export function setPreferredCurrency(currency: CurrencyCode): void {
  if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    try {
      localStorage.setItem(PREFERRED_CURRENCY_KEY, currency);
    } catch {}
  }
}

export function formatPrice(amount: number, currencyCode: CurrencyCode): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount}`;
  }
}
