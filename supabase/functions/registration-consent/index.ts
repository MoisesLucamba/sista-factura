import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const TERMS_VERSION = "2026-10-29-v1";
const PRIVACY_VERSION = "2026-10-29-v1";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Configuração incompleta." }, 500);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    if (body.action === "cancel") {
      if (typeof body.nonce !== "string") return json({ error: "Pedido inválido." }, 400);
      await admin.from("pending_registration_consents").delete().eq("nonce", body.nonce);
      return json({ ok: true });
    }

    if (body.action !== "prepare" || typeof body.email !== "string"
      || body.terms_version !== TERMS_VERSION || body.privacy_version !== PRIVACY_VERSION
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return json({ error: "Confirma os documentos e verifica o email." }, 400);
    }

    await admin.from("pending_registration_consents").delete().lt("expires_at", new Date().toISOString());
    const nonce = crypto.randomUUID();
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = req.headers.get("cf-connecting-ip")
      ?? req.headers.get("x-real-ip")
      ?? forwardedFor
      ?? null;
    const { error } = await admin.from("pending_registration_consents").insert({
      nonce,
      email: body.email.trim().toLowerCase(),
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      ip_address: ipAddress,
      user_agent: req.headers.get("user-agent"),
    });
    if (error) return json({ error: "Não foi possível guardar o aceite." }, 500);
    return json({ nonce });
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
});
