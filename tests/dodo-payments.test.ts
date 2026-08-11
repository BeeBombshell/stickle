import { describe, it, expect } from 'vitest';
import { createDodoCheckoutUrl, DODO_CHECKOUT_BASE, DODO_PRODUCT_IDS } from '../lib/dodo-payments';

describe('lib/dodo-payments — Checkout Generator', () => {
  it('generates a valid Dodo checkout URL for Pro tier with default params', () => {
    const url = createDodoCheckoutUrl({ plan: 'pro' });
    expect(url).toContain(DODO_CHECKOUT_BASE);
    expect(url).toContain(DODO_PRODUCT_IDS.pro);
    expect(url).toContain('currency=');
  });

  it('includes user email and metadata_user_id when provided', () => {
    const url = createDodoCheckoutUrl({
      plan: 'pro',
      userEmail: 'dev@stickle.app',
      userId: 'usr_12345',
      currency: 'EUR',
    });

    expect(url).toContain('email=dev%40stickle.app');
    expect(url).toContain('metadata_user_id=usr_12345');
    expect(url).toContain('currency=EUR');
  });

  it('generates a valid Dodo checkout URL for Teams tier', () => {
    const url = createDodoCheckoutUrl({
      plan: 'teams',
      currency: 'INR',
    });

    expect(url).toContain(DODO_PRODUCT_IDS.teams);
    expect(url).toContain('currency=INR');
  });

  it('supports explicit baseUrl overrides', () => {
    const url = createDodoCheckoutUrl({
      plan: 'pro',
      baseUrl: 'https://test.checkout.dodopayments.com/buy',
    });
    expect(url).toContain('https://test.checkout.dodopayments.com/buy');
  });
});


