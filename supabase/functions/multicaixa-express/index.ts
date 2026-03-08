import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MulticaixaReferenceRequest {
  amount: number;
  description?: string;
  fatura_id?: string;
  payment_link_id?: string;
  expiry_minutes?: number;
}

interface MulticaixaReferenceResponse {
  reference: string;
  entity: string;
  amount: number;
  expiry: string;
  status: string;
}

/**
 * Generates a Multicaixa Express payment reference.
 * Currently in simulation mode — replace with real EMIS API calls when credentials are available.
 */
function generateSimulatedReference(): string {
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return num.toString();
}

function generateEntity(): string {
  // Simulated EMIS entity number
  return "11234";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "POST" && (!path || path === "multicaixa-express")) {
      // ── Generate reference ──
      const body: MulticaixaReferenceRequest = await req.json();

      if (!body.amount || body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Valor inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiryMinutes = body.expiry_minutes || 60;
      const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Generate simulated Multicaixa reference
      // TODO: Replace with real EMIS/GPO API integration
      const reference = generateSimulatedReference();
      const entity = generateEntity();

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "payment",
          status: "pending",
          amount: body.amount,
          currency: "AOA",
          description: body.description || "Pagamento Multicaixa Express",
          payment_method: "multicaixa_express",
          reference: reference,
          external_reference: entity + "-" + reference,
          fatura_id: body.fatura_id || null,
          metadata: {
            entity,
            reference,
            expiry: expiryDate.toISOString(),
            payment_link_id: body.payment_link_id || null,
            simulation: true,
          },
        })
        .select()
        .single();

      if (txError) {
        console.error("Transaction insert error:", txError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar referência", details: txError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If linked to a payment link, update it
      if (body.payment_link_id) {
        await supabase
          .from("payment_links")
          .update({ transaction_id: transaction.id })
          .eq("id", body.payment_link_id)
          .eq("user_id", userId);
      }

      const response: MulticaixaReferenceResponse = {
        reference,
        entity,
        amount: body.amount,
        expiry: expiryDate.toISOString(),
        status: "pending",
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: response,
          transaction_id: transaction.id,
          message: "Referência Multicaixa Express gerada com sucesso (modo simulação)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST" && path === "verify") {
      // ── Verify/Confirm payment (webhook simulation) ──
      const body = await req.json();
      const { transaction_id, reference } = body;

      if (!transaction_id && !reference) {
        return new Response(
          JSON.stringify({ error: "transaction_id ou reference obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find transaction
      let query = supabase.from("transactions").select("*");
      if (transaction_id) {
        query = query.eq("id", transaction_id);
      } else {
        query = query.eq("reference", reference);
      }

      const { data: tx, error: findError } = await query.single();

      if (findError || !tx) {
        return new Response(
          JSON.stringify({ error: "Transacção não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tx.status === "completed") {
        return new Response(
          JSON.stringify({ success: true, message: "Pagamento já confirmado", data: tx }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as completed (simulation)
      const { data: updated, error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", tx.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Erro ao confirmar pagamento" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If linked to a fatura, mark as paid
      if (tx.fatura_id) {
        await supabase
          .from("faturas")
          .update({
            estado: "paga",
            data_pagamento: new Date().toISOString().split("T")[0],
            metodo_pagamento: "Multicaixa Express",
            referencia_pagamento: tx.reference,
          })
          .eq("id", tx.fatura_id);
      }

      // If linked to a payment link, mark as paid
      const metadata = tx.metadata as any;
      if (metadata?.payment_link_id) {
        await supabase
          .from("payment_links")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            use_count: 1,
          })
          .eq("id", metadata.payment_link_id);
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        type: "success",
        title: "Pagamento Confirmado ✅",
        message: `Pagamento de ${tx.amount} Kz via Multicaixa Express (Ref: ${tx.reference}) confirmado com sucesso.`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pagamento confirmado com sucesso",
          data: updated,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET") {
      // ── Check payment status ──
      const transactionId = url.searchParams.get("transaction_id");
      const ref = url.searchParams.get("reference");

      if (!transactionId && !ref) {
        return new Response(
          JSON.stringify({ error: "transaction_id ou reference obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let query = supabase.from("transactions").select("*").eq("user_id", userId);
      if (transactionId) {
        query = query.eq("id", transactionId);
      } else {
        query = query.eq("reference", ref!);
      }

      const { data: tx, error } = await query.single();

      if (error || !tx) {
        return new Response(
          JSON.stringify({ error: "Transacção não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: tx }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Método não suportado" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Multicaixa Express error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
