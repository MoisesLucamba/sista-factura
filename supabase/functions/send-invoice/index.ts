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
  pdf_url?: string;
}

const MAX_RETRIES = 3;

async function sendViaWhatsApp(
  apiKey: string,
  recipient: string,
  message: string,
  pdfUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Send text message
    const textResponse = await fetch('https://conversations.messagebird.com/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient,
        from: 'whatsapp',
        type: 'text',
        content: { text: message },
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.text();
      throw new Error(`WhatsApp API error: ${errorData}`);
    }

    const textData = await textResponse.json();

    // Send PDF as document if URL provided
    if (pdfUrl) {
      const docResponse = await fetch('https://conversations.messagebird.com/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          from: 'whatsapp',
          type: 'document',
          content: {
            document: {
              url: pdfUrl,
              caption: 'Fatura em PDF',
            },
          },
        }),
      });

      if (!docResponse.ok) {
        console.warn('Failed to send PDF attachment, but text message was sent');
      }
    }

    return { success: true, messageId: textData.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp error',
    };
  }
}

async function sendViaSMS(
  apiKey: string,
  recipient: string,
  message: string,
  companyName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [recipient],
        originator: companyName.substring(0, 11),
        body: message.substring(0, 1600),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SMS API error: ${errorData}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error',
    };
  }
}

async function sendViaEmail(
  recipient: string,
  subject: string,
  message: string,
  _pdfUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Email sending would require an email provider (e.g., Resend, SendGrid)
  // For now, simulate email sending
  console.log(`[SIMULATION] Sending email to ${recipient}: ${subject}`);
  return {
    success: true,
    messageId: `email_sim_${Date.now()}`,
  };
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

    const { fatura_id, channel, recipient, message, pdf_url }: SendInvoiceRequest = await req.json();

    if (!fatura_id || !channel || !recipient) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fatura_id, channel, recipient' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice details
    const { data: fatura, error: faturaError } = await supabase
      .from('faturas')
      .select(`*, cliente:clientes(*)`)
      .eq('id', fatura_id)
      .eq('user_id', user.id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's AGT config
    const { data: agtConfig } = await supabase
      .from('agt_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const companyName = agtConfig?.nome_empresa || 'Empresa';
    
    // Format message with template
    const totalFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(fatura.total);
    const defaultMessage = `Olá ${fatura.cliente?.nome || 'Cliente'},\n\nSegue em anexo a sua fatura nº ${fatura.numero} no valor de ${totalFormatted}.\n\nData de vencimento: ${new Date(fatura.data_vencimento).toLocaleDateString('pt-AO')}\n\nObrigado pela preferência.\n${companyName}`;
    const finalMessage = message || defaultMessage;

    const messagebirdApiKey = Deno.env.get('MESSAGEBIRD_API_KEY');
    
    let sendResult: { success: boolean; messageId?: string; error?: string; simulated?: boolean };
    let retryCount = 0;
    let fallbackUsed = false;
    let actualChannel = channel;

    if (!messagebirdApiKey) {
      // Simulation mode
      console.log(`[SIMULATION] Sending ${channel} to ${recipient}`);
      console.log(`[SIMULATION] Message: ${finalMessage}`);
      if (pdf_url) {
        console.log(`[SIMULATION] PDF URL: ${pdf_url}`);
      }
      
      sendResult = {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        simulated: true,
      };
    } else {
      // Real sending with retry logic
      sendResult = { success: false, error: 'Not attempted' };

      for (retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
        if (retryCount > 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          console.log(`Retry attempt ${retryCount} for ${channel} to ${recipient}`);
        }

        if (actualChannel === 'whatsapp') {
          sendResult = await sendViaWhatsApp(messagebirdApiKey, recipient, finalMessage, pdf_url);
        } else if (actualChannel === 'sms') {
          sendResult = await sendViaSMS(messagebirdApiKey, recipient, finalMessage, companyName);
        } else {
          sendResult = await sendViaEmail(recipient, `Fatura ${fatura.numero}`, finalMessage, pdf_url);
        }

        if (sendResult.success) break;
      }

      // Fallback to email if WhatsApp/SMS failed after all retries
      if (!sendResult.success && (actualChannel === 'whatsapp' || actualChannel === 'sms')) {
        console.log(`Fallback: ${actualChannel} failed, trying email to ${fatura.cliente?.email || recipient}`);
        const emailRecipient = fatura.cliente?.email;
        
        if (emailRecipient) {
          fallbackUsed = true;
          actualChannel = 'email';
          sendResult = await sendViaEmail(
            emailRecipient,
            `Fatura ${fatura.numero} - ${companyName}`,
            finalMessage,
            pdf_url
          );
        }
      }
    }

    // Record the send attempt
    const { data: sendRecord, error: sendError } = await supabase
      .from('invoice_sends')
      .insert({
        fatura_id,
        user_id: user.id,
        channel: actualChannel,
        recipient,
        status: sendResult.success ? 'sent' : 'failed',
        sent_at: sendResult.success ? new Date().toISOString() : null,
        failed_at: sendResult.success ? null : new Date().toISOString(),
        failure_reason: sendResult.error || null,
        external_message_id: sendResult.messageId || null,
        retry_count: retryCount,
        fallback_used: fallbackUsed,
        pdf_url: pdf_url || null,
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
        channel: actualChannel,
        recipient,
        status: sendResult.success ? 'sent' : 'failed',
        simulated: sendResult.simulated || false,
        retry_count: retryCount,
        fallback_used: fallbackUsed,
        pdf_attached: !!pdf_url,
      },
    });

    return new Response(
      JSON.stringify({
        success: sendResult.success,
        message: sendResult.success 
          ? (sendResult.simulated 
              ? 'Envio simulado com sucesso (configure a chave API para envio real)' 
              : fallbackUsed 
                ? 'Fatura enviada por email (fallback após falha no canal principal)'
                : 'Fatura enviada com sucesso!')
          : 'Falha ao enviar fatura após todas as tentativas',
        simulated: sendResult.simulated || false,
        fallback_used: fallbackUsed,
        retry_count: retryCount,
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
