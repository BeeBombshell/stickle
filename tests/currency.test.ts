import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectUserCurrency,
  formatPrice,
  getProPriceFormatted,
  getTeamsPriceFormatted,
  SUPPORTED_CURRENCIES,
  setPreferredCurrency,
} from '../lib/currency';

describe('lib/currency — Multi-Currency Pricing Engine', () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Reset window.localStorage mock before each test
    const storage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {},
      length: 0,
      key: () => null,
    } as any;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('contains valid pricing configs for all 8 supported currencies', () => {
    const codes = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'BRL', 'JPY'];
    for (const code of codes) {
      const config = (SUPPORTED_CURRENCIES as any)[code];
      expect(config).toBeDefined();
      expect(config.symbol).toBeTruthy();
      expect(config.proPrice).toBeGreaterThan(0);
      expect(config.teamsPrice).toBeGreaterThan(0);
    }
  });

  it('formats price strings correctly', () => {
    expect(formatPrice(29, 'USD')).toContain('29');
    expect(formatPrice(27, 'EUR')).toContain('27');
    expect(formatPrice(2399, 'INR')).toContain('2');
    expect(formatPrice(4200, 'JPY')).toContain('4');
  });

  it('returns explicit preferred currency when saved in localStorage', () => {
    setPreferredCurrency('EUR');
    expect(detectUserCurrency()).toBe('EUR');

    setPreferredCurrency('INR');
    expect(detectUserCurrency()).toBe('INR');
  });

  it('returns formatted Pro and Teams prices for specific currency', () => {
    const proFormatted = getProPriceFormatted('USD');
    const teamsFormatted = getTeamsPriceFormatted('USD');

    expect(proFormatted).toContain('29');
    expect(teamsFormatted).toContain('9');
  });
});
