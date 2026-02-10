import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import type { Fatura } from '@/hooks/useFaturas';

export function useAutoSendInvoice() {
  const [isSending, setIsSending] = useState(false);

  // Check if auto-send is enabled in settings
  const isAutoSendEnabled = () => {
    // You can store this in localStorage or user settings
    const settings = localStorage.getItem('invoiceSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.autoSendWhatsApp === true;
    }
    return false;
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('244')) {
      return '244' + cleaned;
    }
    return cleaned;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-AO');
  };

  const getDefaultMessage = (fatura: Fatura): string => {
    return `Olá ${fatura.cliente?.nome || 'Cliente'},

Segue em anexo a ${fatura.tipo === 'fatura' ? 'fatura' : 'fatura-recibo'} ${fatura.numero}.

Valor total: ${formatCurrency(Number(fatura.total))}
Data de vencimento: ${formatDate(fatura.data_vencimento)}

Qualquer dúvida, estamos à disposição.

Atenciosamente`;
  };

  const autoSend = async (faturaId: string) => {
    if (!isAutoSendEnabled()) {
      return;
    }

    setIsSending(true);

    try {
      // Fetch full fatura
      const { data: fatura, error: faturaError } = await supabase
        .from('faturas')
        .select(`*, cliente:clientes(*)`)
        .eq('id', faturaId)
        .single();

      if (faturaError) throw faturaError;

      // Check if client has phone
      if (!fatura.cliente?.telefone) {
        toast.warning('Cliente sem telefone cadastrado', {
          description: 'Não foi possível enviar automaticamente via WhatsApp',
        });
        return;
      }

      // Fetch items
      const { data: itens, error: itensError } = await supabase
        .from('itens_fatura')
        .select(`*, produto:produtos(*)`)
        .eq('fatura_id', faturaId);

      if (itensError) throw itensError;

      const fullFatura = { ...fatura, itens } as Fatura;

      // Generate PDF
      const pdfBlob = await generateInvoicePDF(fullFatura);

      // Download PDF
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${fatura.numero.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Prepare WhatsApp message
      const message = getDefaultMessage(fullFatura);
      const phone = formatPhoneForWhatsApp(fatura.cliente.telefone);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 500); // Small delay to allow PDF download to complete

      toast.success('WhatsApp aberto automaticamente', {
        description: 'PDF baixado. Anexe o arquivo e envie.',
      });
    } catch (error) {
      console.error('Error auto-sending invoice:', error);
      toast.error('Erro ao enviar automaticamente');
    } finally {
      setIsSending(false);
    }
  };

  return {
    autoSend,
    isSending,
    isAutoSendEnabled: isAutoSendEnabled(),
  };
}