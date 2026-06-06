// Charge a single pending subscription_invoice (manual retry / "Pagar agora")
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { invoice_id, method } = await req.json();
    if (!invoice_id) throw new Error('invoice_id obrigatório');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: inv, error } = await supabase
      .from('subscription_invoices')
      .select('*, subscription:subscriptions(*)')
      .eq('id', invoice_id)
      .single();
    if (error || !inv) throw new Error('Fatura não encontrada');
    if (inv.status === 'paid') {
      return new Response(JSON.stringify({ ok: true, alreadyPaid: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const useMethod = method || inv.subscription?.payment_method || 'wallet';
    let paid = false;
    let reference: string | null = null;
    let errorMessage: string | null = null;

    try {
      await supabase.from('transactions').insert({
        user_id: inv.user_id,
        type: 'fee',
        amount: inv.total,
        status: 'completed',
        description: `Pagamento manual subscrição ${inv.period_start.substring(0, 7)}`,
        metadata: { subscription_invoice_id: inv.id, method: useMethod },
      });
      paid = true;
      reference = `${useMethod.toUpperCase()}-${inv.id.substring(0, 8)}`;
    } catch (e: any) {
      errorMessage = e.message;
    }

    await supabase.from('subscription_invoices').update({
      status: paid ? 'paid' : 'failed',
      paid_at: paid ? new Date().toISOString() : null,
      payment_method: paid ? useMethod : null,
      payment_reference: reference,
      attempts: (inv.attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      error_message: errorMessage,
    }).eq('id', inv.id);

    if (paid) {
      await supabase.from('subscriptions').update({
        status: 'active', grace_until: null,
      }).eq('id', inv.subscription_id);
    }

    return new Response(JSON.stringify({ ok: paid, reference, error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
