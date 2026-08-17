import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSupabaseAdminClient } from '../auth.js';

export interface DodoWebhookPayload {
  event: 'payment.succeeded' | 'subscription.active' | 'subscription.cancelled' | 'subscription.expired' | string;
  data?: {
    id?: string;
    product_id?: string;
    license_key?: string;
    customer?: {
      email?: string;
      id?: string;
    };
    custom_data?: {
      user_id?: string;
      [key: string]: any;
    };
    metadata?: {
      user_id?: string;
      [key: string]: any;
    };
  };
}

/**
 * Verify HMAC SHA256 webhook signature from Dodo Payments.
 */
export function verifyDodoSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const computedSignature = createHmac('sha256', secret).update(rawBody).digest('hex');
    const signatureBuffer = Buffer.from(signature.trim(), 'utf8');
    const computedBuffer = Buffer.from(computedSignature, 'utf8');
    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }
    return timingSafeEqual(signatureBuffer, computedBuffer);
  } catch (err) {
    console.error('Error verifying signature:', err);
    return false;
  }
}

/**
 * Hono webhook route handler for Dodo Payments events.
 */
export async function handleDodoWebhook(c: Context) {
  const rawBody = await c.req.text();
  const signature =
    c.req.header('dodo-signature') ||
    c.req.header('x-dodo-signature') ||
    c.req.header('signature') ||
    null;

  const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  // Verify signature if secret is configured in production environment
  if (webhookSecret) {
    const isValid = verifyDodoSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 401);
    }
  }

  let payload: DodoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const { event, data } = payload;
  if (!event || !data) {
    return c.json({ message: 'Ignored empty payload' }, 200);
  }

  const email = data.customer?.email?.toLowerCase()?.trim();
  const userId = data.metadata?.user_id || data.custom_data?.user_id;
  const licenseKey = data.license_key || data.id || `lic_dodo_${Date.now()}`;
  const productId = data.product_id || '';

  const supabase = getSupabaseAdminClient();

  if (event === 'payment.succeeded' || event === 'subscription.active') {
    const isTeams = productId.includes('teams');
    const targetTier = isTeams ? 'team_member' : 'supporter';

    let resolvedUserId = userId;

    if (!resolvedUserId && email) {
      // Find profile by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        resolvedUserId = profile.id;
      }
    }

    if (resolvedUserId) {
      const { error } = await supabase
        .from('profiles')
        .update({
          tier: targetTier,
          license_key: licenseKey,
        })
        .eq('id', resolvedUserId);

      if (error) {
        console.error('Failed to update profile tier:', error);
        return c.json({ error: 'Database update failed' }, 500);
      }
    } else if (email) {
      // Upsert profile row if profile doesn't exist yet
      const { error } = await supabase.from('profiles').upsert({
        email,
        tier: targetTier,
        license_key: licenseKey,
      });

      if (error) {
        console.error('Failed to upsert profile tier:', error);
      }
    }

    return c.json({ success: true, event, tier: targetTier });
  }

  if (event === 'subscription.cancelled' || event === 'subscription.expired') {
    let resolvedUserId = userId;
    if (!resolvedUserId && email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile) resolvedUserId = profile.id;
    }

    if (resolvedUserId) {
      await supabase
        .from('profiles')
        .update({ tier: 'free' })
        .eq('id', resolvedUserId);
    }

    return c.json({ success: true, event, tier: 'free' });
  }

  return c.json({ success: true, message: `Event ${event} received` });
}
