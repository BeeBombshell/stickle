import { detectUserCurrency, type CurrencyCode } from './currency';

export interface DodoCheckoutOptions {
  productId?: string;
  plan?: 'pro' | 'teams';
  userEmail?: string;
  userId?: string;
  currency?: CurrencyCode;
  redirectUrl?: string;
  baseUrl?: string;
}

export const DODO_PRODUCT_IDS = {
  pro: (typeof process !== 'undefined' && (process.env.VITE_DODO_PRO_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_PRO_PRODUCT_ID)) || 'pdt_0Nl9lGWQvqCWbQeHWJUle',
  teams: (typeof process !== 'undefined' && (process.env.VITE_DODO_TEAMS_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_TEAMS_PRODUCT_ID)) || 'pdt_0Nl9mWm4DnZhgdyBuDIa4',
};

export const DODO_CHECKOUT_BASE =
  (typeof process !== 'undefined' && (process.env.VITE_DODO_CHECKOUT_URL || process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL)) ||
  'https://test.checkout.dodopayments.com/buy';

/**
 * Builds a Dodo Payments checkout URL with localized currency and customer metadata.
 */
export function createDodoCheckoutUrl(options: DodoCheckoutOptions = {}): string {
  const plan = options.plan || 'pro';
  const productId = options.productId || DODO_PRODUCT_IDS[plan];
  const currency = options.currency || detectUserCurrency();
  const baseUrl = options.baseUrl || DODO_CHECKOUT_BASE;

  const url = new URL(`${baseUrl}/${productId}`);

  url.searchParams.set('currency', currency);

  if (options.userEmail) {
    url.searchParams.set('email', options.userEmail);
  }

  if (options.userId) {
    url.searchParams.set('metadata_user_id', options.userId);
  }

  const redirectUrl =
    options.redirectUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/upgrade`
      : 'https://stickle.app/upgrade');

  url.searchParams.set('redirect_url', redirectUrl);

  return url.toString();
}

/**
 * Opens Dodo Payments checkout overlay or new tab.
 */
export function openDodoCheckout(options: DodoCheckoutOptions = {}): void {
  const checkoutUrl = createDodoCheckoutUrl(options);
  if (typeof window !== 'undefined') {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  }
}

