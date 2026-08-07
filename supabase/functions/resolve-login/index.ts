import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Resolve um identificador de login (email ou telefone) para o email da conta. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { identifier } = await req.json();
    if (typeof identifier !== "string" || identifier.trim().length < 6) {
      return json({ error: "Indica o teu email ou número de telefone." }, 400);
    }

    const value = identifier.trim();
    if (value.includes("@")) return json({ email: value.toLowerCase() });

    const digits = value.replace(/\D/g, "");
    if (digits.length < 9) {
      return json({ error: "Número de telefone inválido." }, 400);
    }
    const last9 = digits.slice(-9);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("email, telefone")
      .not("telefone", "is", null)
      .limit(2000);

    if (error) return json({ error: "Erro ao verificar a conta." }, 500);

    const match = (data ?? []).find(
      (p: { email: string; telefone: string | null }) =>
        (p.telefone ?? "").replace(/\D/g, "").slice(-9) === last9,
    );

    if (!match) return json({ error: "Não existe conta com esse número." }, 404);
    return json({ email: match.email });
  } catch {
    return json({ error: "Erro interno." }, 500);
  }
});
