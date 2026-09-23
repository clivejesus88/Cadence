import { createClient } from 'jsr:@supabase/supabase-js@2';

const FLW_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY') ?? '';
const PLANS = {
  monthly: {
    planId: Deno.env.get('FLUTTERWAVE_PLAN_ID_MONTHLY') ?? '',
    amount: Number(Deno.env.get('FLUTTERWAVE_PRICE_MONTHLY') ?? '6.99')
  },
  yearly: {
    planId: Deno.env.get('FLUTTERWAVE_PLAN_ID_YEARLY') ?? '',
    amount: Number(Deno.env.get('FLUTTERWAVE_PRICE_YEARLY') ?? '47.99')
  }
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
  const cfg = PLANS[plan];
  if (!cfg.planId) {
    return new Response('Payment plan not configured', { status: 503 });
  }

  const { data: profile } = await supabase
    .from('profile')
    .select('email, name')
    .eq('user_id', user.id)
    .maybeSingle();

  const email = (profile?.email as string | undefined) ?? user.email;
  const name = (profile?.name as string | undefined) ?? '';

  const origin = new URL(req.url).origin;
  const redirectUrl = typeof body.redirectUrl === 'string' ? body.redirectUrl : `${origin}/?paywall=1`;

  const txRef = `cadence-${user.id}-${Date.now()}`;
  const payload = {
    tx_ref: txRef,
    amount: cfg.amount,
    currency: 'USD',
    redirect_url: redirectUrl,
    payment_plan: cfg.planId,
    meta: { user_id: user.id },
    customer: { email, name, phonenumber: '' },
    customizations: {
      title: 'Cadence Pro',
      description: `Cadence Pro · ${plan === 'yearly' ? 'Yearly' : 'Monthly'}`
    }
  };

  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = (await res.json()) as { status: string; message?: string; data?: { link?: string } };
  if (!res.ok || json.status !== 'success' || !json.data?.link) {
    console.error('[flutterwave] checkout failed:', json.message ?? json);
    return new Response('Failed to create checkout', { status: 502 });
  }

  return new Response(JSON.stringify({ url: json.data.link }), {
    headers: { 'Content-Type': 'application/json' }
  });
});