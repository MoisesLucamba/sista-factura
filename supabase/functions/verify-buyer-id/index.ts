import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nif, id_doc_front_url, id_doc_back_url, id_doc_nif_url, nome, email, tipo, approval_status, seller_subtype")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.approval_status === "approved") {
      return new Response(JSON.stringify({ status: "already_approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine document type based on user type
    const isComprador = profile.tipo === "comprador";
    const isVendedorPessoal = profile.tipo === "vendedor" && profile.seller_subtype === "pessoal";
    const isVendedorEmpresa = profile.tipo === "vendedor" && profile.seller_subtype === "empresa";
    const needsFrontBack = isComprador || isVendedorPessoal;
    const needsNifDoc = isVendedorEmpresa;

    // Sellers without subtype (legacy) - auto-approve
    if (profile.tipo === "vendedor" && !profile.seller_subtype) {
      await supabase.from("profiles").update({ approval_status: "approved", approved_at: new Date().toISOString() }).eq("user_id", user_id);
      return new Response(JSON.stringify({ status: "approved", reason: "Legacy seller auto-approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check required documents
    if (needsFrontBack && (!profile.id_doc_front_url || !profile.id_doc_back_url)) {
      await supabase.from("profiles").update({ 
        approval_status: "rejected", 
        rejection_reason: "Documentos de identificação não foram enviados." 
      }).eq("user_id", user_id);
      return new Response(JSON.stringify({ status: "rejected", reason: "No ID documents uploaded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (needsNifDoc && !profile.id_doc_nif_url) {
      await supabase.from("profiles").update({ 
        approval_status: "rejected", 
        rejection_reason: "Documento de confirmação do NIF não foi enviado." 
      }).eq("user_id", user_id);
      return new Response(JSON.stringify({ status: "rejected", reason: "No NIF document uploaded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare images for AI verification
    const imageContents: Array<{ type: string; image_url?: { url: string }; text?: string }> = [];
    
    if (needsFrontBack) {
      const { data: frontUrl } = await supabase.storage.from("id-documents").createSignedUrl(profile.id_doc_front_url, 300);
      const { data: backUrl } = await supabase.storage.from("id-documents").createSignedUrl(profile.id_doc_back_url, 300);

      if (!frontUrl?.signedUrl || !backUrl?.signedUrl) throw new Error("Failed to generate signed URLs");

      const [frontResp, backResp] = await Promise.all([fetch(frontUrl.signedUrl), fetch(backUrl.signedUrl)]);
      const [frontBuf, backBuf] = await Promise.all([frontResp.arrayBuffer(), backResp.arrayBuffer()]);
      const frontBase64 = btoa(String.fromCharCode(...new Uint8Array(frontBuf)));
      const backBase64 = btoa(String.fromCharCode(...new Uint8Array(backBuf)));
      const frontMime = frontResp.headers.get("content-type") || "image/jpeg";
      const backMime = backResp.headers.get("content-type") || "image/jpeg";

      imageContents.push(
        { type: "text", text: `Extract the identification number from these ID document images. The user claims their NIF is: ${profile.nif}` },
        { type: "image_url", image_url: { url: `data:${frontMime};base64,${frontBase64}` } },
        { type: "image_url", image_url: { url: `data:${backMime};base64,${backBase64}` } },
      );
    } else if (needsNifDoc) {
      const { data: nifUrl } = await supabase.storage.from("id-documents").createSignedUrl(profile.id_doc_nif_url, 300);
      if (!nifUrl?.signedUrl) throw new Error("Failed to generate signed URL for NIF doc");

      const nifResp = await fetch(nifUrl.signedUrl);
      const nifBuf = await nifResp.arrayBuffer();
      const nifBase64 = btoa(String.fromCharCode(...new Uint8Array(nifBuf)));
      const nifMime = nifResp.headers.get("content-type") || "image/jpeg";

      imageContents.push(
        { type: "text", text: `Extract the company NIF/tax identification number from this official document. The user claims their company NIF is: ${profile.nif}` },
        { type: "image_url", image_url: { url: `data:${nifMime};base64,${nifBase64}` } },
      );
    }

    // Call AI for verification
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an ID document verification assistant. Your task is to extract the identification number (NIF or BI number) from identity document images.
            
Rules:
- Look at both the front and back of the document (if provided)
- Extract ALL numbers that could be an identification number (NIF, BI, Passport number, company tax number)
- The NIF format in Angola is typically a numeric string (e.g., "005123456LA789")
- For company documents, look for the NIF/tax registration number
- Return ONLY a JSON object with the format: {"extracted_numbers": ["number1", "number2"], "confidence": "high"|"medium"|"low"}
- If you cannot read any number, return: {"extracted_numbers": [], "confidence": "none"}
- Do NOT include any other text, only the JSON object`
          },
          { role: "user", content: imageContents },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ status: "pending_manual", reason: "AI verification failed, queued for manual review" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";
    console.log("AI response:", aiContent);

    let extractedData: { extracted_numbers: string[]; confidence: string };
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { extracted_numbers: [], confidence: "none" };
    } catch {
      extractedData = { extracted_numbers: [], confidence: "none" };
    }

    const userNif = (profile.nif || "").replace(/[\s\-\.]/g, "").toUpperCase();
    const matched = extractedData.extracted_numbers.some((num: string) => {
      const cleanNum = num.replace(/[\s\-\.]/g, "").toUpperCase();
      return cleanNum === userNif || cleanNum.includes(userNif) || userNif.includes(cleanNum);
    });

    if (matched && extractedData.confidence !== "none") {
      await supabase.from("profiles").update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
      }).eq("user_id", user_id);

      return new Response(JSON.stringify({ 
        status: "approved", reason: "NIF matches document", confidence: extractedData.confidence 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      const reason = extractedData.extracted_numbers.length === 0
        ? "Não foi possível ler o número de identificação no documento enviado."
        : `O número de identificação no documento não corresponde ao NIF informado (${profile.nif}).`;

      await supabase.from("profiles").update({
        approval_status: "rejected",
        rejection_reason: reason,
      }).eq("user_id", user_id);

      return new Response(JSON.stringify({ 
        status: "rejected", reason, extracted: extractedData.extracted_numbers, user_nif: profile.nif,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("verify-buyer-id error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
