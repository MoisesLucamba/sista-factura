import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const authorization = req.headers.get("authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authorization?.startsWith("Bearer ") || !url || !serviceKey) {
      return json({ error: "Sessão inválida." }, 401);
    }
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const token = authorization.slice("Bearer ".length);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: "Sessão inválida." }, 401);

    const body = await req.json();
    const type = body.consent_type;
    if (!['saft_analysis', 'bank_share'].includes(type)
      || typeof body.granted !== 'boolean'
      || typeof body.document_version !== 'string'
      || body.document_version.length > 80) {
      return json({ error: "Consentimento inválido." }, 400);
    }

    let bankId: string | null = null;
    let requestId: string | null = null;
    if (type === 'bank_share') {
      if (typeof body.bank_id !== 'string' || typeof body.request_id !== 'string') {
        return json({ error: "Indica o banco e o pedido." }, 400);
      }
      const { data: request, error: requestError } = await admin
        .from('pedidos_credito')
        .select('id, user_id, banco_id')
        .eq('id', body.request_id)
        .eq('user_id', user.id)
        .single();
      if (requestError || !request || (request.banco_id && request.banco_id !== body.bank_id)) {
        return json({ error: "O pedido não corresponde ao banco escolhido." }, 403);
      }
      bankId = request.banco_id;
      requestId = request.id;
    }

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = req.headers.get("cf-connecting-ip")
      ?? req.headers.get("x-real-ip")
      ?? forwardedFor
      ?? null;
    const { error } = await admin.from('consent_events').insert({
      user_id: user.id,
      consent_type: type,
      granted: body.granted,
      document_version: body.document_version,
      bank_id: bankId,
      request_id: requestId,
      ip_address: ipAddress,
      user_agent: req.headers.get("user-agent"),
    });
    if (error) return json({ error: "Não foi possível guardar o consentimento." }, 500);
    if (type === 'bank_share' && requestId) {
      const { error: updateError } = await admin
        .from('pedidos_credito')
        .update({ banco_id: body.granted ? bankId : null })
        .eq('id', requestId)
        .eq('user_id', user.id);
      if (updateError) return json({ error: "Consentimento guardado, mas não foi possível actualizar o pedido." }, 500);
    }
    return json({ ok: true });
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
});
