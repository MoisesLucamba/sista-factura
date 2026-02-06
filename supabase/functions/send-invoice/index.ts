import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceRequest {
  fatura_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fatura_id, channel, recipient, message }: SendInvoiceRequest = await req.json();

    if (!fatura_id || !channel || !recipient) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fatura_id, channel, recipient' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice details
    const { data: fatura, error: faturaError } = await supabase
      .from('faturas')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', fatura_id)
      .eq('user_id', user.id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's AGT config for company info
    const { data: agtConfig } = await supabase
      .from('agt_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const companyName = agtConfig?.nome_empresa || 'Empresa';
    
    // Format message
    const defaultMessage = `Olá ${fatura.cliente?.nome || 'Cliente'},\n\nSegue a sua fatura nº ${fatura.numero} no valor de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(fatura.total)}.\n\nData de vencimento: ${new Date(fatura.data_vencimento).toLocaleDateString('pt-AO')}\n\nObrigado,\n${companyName}`;

    const finalMessage = message || defaultMessage;

    // Check if MessageBird API key is configured
    const messagebirdApiKey = Deno.env.get('MESSAGEBIRD_API_KEY');
    
    let sendResult: { success: boolean; messageId?: string; error?: string; simulated?: boolean };

    if (!messagebirdApiKey) {
      // Simulation mode - no API key configured
      console.log(`[SIMULATION] Sending ${channel} to ${recipient}`);
      console.log(`[SIMULATION] Message: ${finalMessage}`);
      
      sendResult = {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        simulated: true,
      };
    } else {
      // Real MessageBird integration
      try {
        if (channel === 'whatsapp') {
          // MessageBird WhatsApp API
          const response = await fetch('https://conversations.messagebird.com/v1/send', {
            method: 'POST',
            headers: {
              'Authorization': `AccessKey ${messagebirdApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: recipient,
              from: 'whatsapp', // Will use default WhatsApp channel
              type: 'text',
              content: {
                text: finalMessage,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`MessageBird API error: ${errorData}`);
          }

          const data = await response.json();
          sendResult = {
            success: true,
            messageId: data.id,
          };
        } else if (channel === 'sms') {
          // MessageBird SMS API
          const response = await fetch('https://rest.messagebird.com/messages', {
            method: 'POST',
            headers: {
              'Authorization': `AccessKey ${messagebirdApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipients: [recipient],
              originator: companyName.substring(0, 11), // Max 11 chars for alphanumeric
              body: finalMessage.substring(0, 1600), // SMS limit
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`MessageBird API error: ${errorData}`);
          }

          const data = await response.json();
          sendResult = {
            success: true,
            messageId: data.id,
          };
        } else {
          sendResult = {
            success: false,
            error: 'Email channel not implemented yet',
          };
        }
      } catch (apiError) {
        console.error('MessageBird API error:', apiError);
        sendResult = {
          success: false,
          error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        };
      }
    }

    // Record the send attempt
    const { data: sendRecord, error: sendError } = await supabase
      .from('invoice_sends')
      .insert({
        fatura_id,
        user_id: user.id,
        channel,
        recipient,
        status: sendResult.success ? 'sent' : 'failed',
        sent_at: sendResult.success ? new Date().toISOString() : null,
        failed_at: sendResult.success ? null : new Date().toISOString(),
        failure_reason: sendResult.error || null,
        external_message_id: sendResult.messageId || null,
      })
      .select()
      .single();

    if (sendError) {
      console.error('Error recording send:', sendError);
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'INVOICE_SEND',
      entity_type: 'fatura',
      entity_id: fatura_id,
      new_data: {
        channel,
        recipient,
        status: sendResult.success ? 'sent' : 'failed',
        simulated: sendResult.simulated || false,
      },
    });

    return new Response(
      JSON.stringify({
        success: sendResult.success,
        message: sendResult.success 
          ? (sendResult.simulated 
              ? 'Envio simulado com sucesso (configure a chave MessageBird para envio real)' 
              : 'Fatura enviada com sucesso!')
          : 'Falha ao enviar fatura',
        simulated: sendResult.simulated || false,
        sendRecord,
        error: sendResult.error,
      }),
      { 
        status: sendResult.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
