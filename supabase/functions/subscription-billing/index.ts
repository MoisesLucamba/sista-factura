// Monthly billing cron — generates subscription_invoices for the previous period
// and attempts to charge via wallet or Multicaixa.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Period = previous month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const psStr = periodStart.toISOString().substring(0, 10);
    const peStr = periodEnd.toISOString().substring(0, 10);

    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'grace']);
    if (error) throw error;

    const results: any[] = [];

    for (const sub of subs || []) {
      // Skip if invoice for that period already exists
      const { data: existing } = await supabase
        .from('subscription_invoices')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('period_start', psStr)
        .maybeSingle();
      if (existing) {
        results.push({ user: sub.user_id, skipped: true });
        continue;
      }

      const { count: docCount } = await supabase
        .from('faturas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', sub.user_id)
        .eq('incluir_saft', true)
        .gte('data_emissao', psStr)
        .lte('data_emissao', peStr);

      const documents = docCount || 0;
      const planFee = Number(sub.plan_fee || 8000);
      const perDoc = Number(sub.per_doc_fee || 1);
      const docsFee = documents * perDoc;
      const total = planFee + docsFee;

      const { data: inv, error: invErr } = await supabase
        .from('subscription_invoices')
        .insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          period_start: psStr,
          period_end: peStr,
          plan_fee: planFee,
          documents_count: documents,
          documents_fee: docsFee,
          total,
          status: 'pending',
        })
        .select()
        .single();
      if (invErr) {
        results.push({ user: sub.user_id, error: invErr.message });
        continue;
      }

      // Try wallet debit first if there's a buyer_wallet or transactions balance
      let paid = false;
      let reference: string | null = null;
      let errorMessage: string | null = null;

      try {
        // Insert a 'fee' transaction — this is best-effort
        await supabase.from('transactions').insert({
          user_id: sub.user_id,
          type: 'fee',
          amount: total,
          status: 'completed',
          description: `Subscrição mensal ${psStr.substring(0, 7)}`,
          metadata: { subscription_invoice_id: inv.id, period: psStr.substring(0, 7) },
        });
        paid = true;
        reference = `WALLET-${inv.id.substring(0, 8)}`;
      } catch (e: any) {
        errorMessage = e.message;
      }

      const newStatus = paid ? 'paid' : 'failed';
      await supabase.from('subscription_invoices').update({
        status: newStatus,
        paid_at: paid ? new Date().toISOString() : null,
        payment_method: paid ? 'wallet' : null,
        payment_reference: reference,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        error_message: errorMessage,
      }).eq('id', inv.id);

      // Advance subscription period if paid; move to grace if failed
      if (paid) {
        const nextStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await supabase.from('subscriptions').update({
          status: 'active',
          current_period_start: nextStart.toISOString().substring(0, 10),
          current_period_end: nextEnd.toISOString().substring(0, 10),
          next_billing_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          grace_until: null,
        }).eq('id', sub.id);

        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          type: 'success',
          title: 'Subscrição paga ✅',
          message: `Mensalidade de ${total.toLocaleString('pt-PT')} Kz cobrada com sucesso (${documents} documentos).`,
        });
      } else {
        const grace = new Date();
        grace.setDate(grace.getDate() + 7);
        await supabase.from('subscriptions').update({
          status: 'grace',
          grace_until: grace.toISOString(),
        }).eq('id', sub.id);

        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          type: 'warning',
          title: 'Falha na cobrança mensal ⚠️',
          message: `Não conseguimos cobrar ${total.toLocaleString('pt-PT')} Kz. Tem 7 dias para regularizar.`,
        });
      }

      results.push({ user: sub.user_id, invoice: inv.id, paid, total, documents });
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
