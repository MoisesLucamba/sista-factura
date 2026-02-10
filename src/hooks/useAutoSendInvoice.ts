import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgtConfig } from './useAgtConfig';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import type { Fatura } from './useFaturas';
import { toast } from 'sonner';

export function useAutoSendInvoice() {
  const { user } = useAuth();
  const { data: agtConfig } = useAgtConfig();

  const autoSend = useCallback(async (faturaId: string) => {
    if (!user || !agtConfig?.auto_send_invoice) return;

    try {
      // Fetch full invoice with client and items
      const { data: fatura, error: faturaError } = await supabase
        .from('faturas')
        .select(`*, cliente:clientes(*)`)
        .eq('id', faturaId)
        .single();

      if (faturaError || !fatura) {
        console.error('Auto-send: Invoice not found', faturaError);
        return;
      }

      const cliente = fatura.cliente as any;

      // Check if client has WhatsApp consent and is enabled
      if (!cliente?.whatsapp_consent || !cliente?.whatsapp_enabled) {
        console.log('Auto-send: Client has no WhatsApp consent or is disabled');
        return;
      }

      // Determine recipient
      const channel = agtConfig.default_send_channel || 'whatsapp';
      let recipient = '';

      if (channel === 'email') {
        recipient = cliente.email || '';
      } else {
        let phone = (cliente.telefone || '').replace(/\s+/g, '');
        if (phone && !phone.startsWith('+') && !phone.startsWith('244')) {
          phone = '244' + phone;
        }
        recipient = phone;
      }

      if (!recipient) {
        console.log('Auto-send: No recipient available');
        return;
      }

      // Fetch items for PDF generation
      const { data: itens } = await supabase
        .from('itens_fatura')
        .select(`*, produto:produtos(*)`)
        .eq('fatura_id', faturaId);

      const fullFatura = { ...fatura, itens: itens || [] } as Fatura;

      // Generate PDF
      const pdfBlob = await generateInvoicePDF(fullFatura);

      // Upload PDF to storage
      const fileName = `${fatura.numero.replace(/\//g, '-')}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Auto-send: PDF upload failed', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      const pdfUrl = urlData.publicUrl;

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Send invoice
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fatura_id: faturaId,
            channel,
            recipient,
            pdf_url: pdfUrl,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.simulated) {
          toast.info(`Fatura ${fatura.numero} enviada automaticamente (modo simulação)`);
        } else {
          toast.success(`Fatura ${fatura.numero} enviada automaticamente via ${channel}!`);
        }
      } else {
        toast.warning(`Envio automático da fatura ${fatura.numero} falhou: ${result.error || 'erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Auto-send error:', error);
    }
  }, [user, agtConfig]);

  return { autoSend, isAutoSendEnabled: agtConfig?.auto_send_invoice || false };
}
