import { createClient } from 'jsr:@supabase/supabase-js@2';

const FLW_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY') ?? '';
const WEBHOOK_HASH = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${id}/verify`, {
      headers: { Authorization: `Bearer ${FLW_SECRET}` }
    });
    const json = (await res.json()) as { status: string; data?: { status?: string; currency?: string } };
    return json.status === 'success' && json.data?.status === 'successful' && json.data?.currency === 'USD';
  } catch {
    return false;
  }
}

function memberSinceLabel(raw: unknown): string {
  let ts: number;
  if (typeof raw === 'number') {
    ts = raw < 1e12 ? raw * 1000 : raw;
  } else if (typeof raw === 'string') {
    ts = Date.parse(raw);
  } else {
    ts = Date.now();
  }
  if (Number.isNaN(ts)) ts = Date.now();
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const hash = req.headers.get('verif-hash') ?? '';
  if (!WEBHOOK_HASH || !safeEqual(WEBHOOK_HASH, hash)) {
    return new Response('Invalid hash', { status: 401 });
  }

  const payload = (await req.json()) as Record<string, unknown>;
  const event = payload.event as string;
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const meta = (data.meta ?? {}) as Record<string, unknown>;
  const userId = typeof meta.user_id === 'string' && meta.user_id ? meta.user_id : undefined;
  const email = ((data.customer as Record<string, unknown> | undefined)?.email as string | undefined)?.toLowerCase();

  const apply = async (update: { plan: 'pro' | 'free'; member_since: string }) => {
    let q = supabase.from('profile').update(update);
    if (userId) q = q.eq('user_id', userId);
    else if (email) q = q.eq('email', email);
    else return;
    const { error } = await q;
    if (error) console.error('[flutterwave] profile update failed:', error.message);
  };

  switch (event) {
    case 'charge.completed': {
      const id = String(data.id ?? '');
      if (!id) return new Response('Missing transaction id', { status: 400 });
      const valid = await verifyTransaction(id);
      if (!valid) {
        console.error('[flutterwave] verification failed for tx', id);
        return new Response('Verification failed', { status: 200 });
      }
      await apply({ plan: 'pro', member_since: memberSinceLabel(data.created_at) });
      return new Response('OK', { status: 200 });
    }
    case 'subscription.cancelled':
    case 'subscription.expired':
      await apply({ plan: 'free', member_since: '' });
      return new Response('OK', { status: 200 });
    default:
      return new Response('Ignored', { status: 200 });
  }
});