import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InvoiceSend {
  id: string;
  fatura_id: string;
  user_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  failure_reason?: string;
  external_message_id?: string;
  retry_count: number;
  max_retries: number;
  fallback_used: boolean;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export function useInvoiceSends(faturaId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoice-sends', faturaId],
    queryFn: async () => {
      let query = supabase
        .from('invoice_sends')
        .select('*')
        .order('created_at', { ascending: false });

      if (faturaId) {
        query = query.eq('fatura_id', faturaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InvoiceSend[];
    },
    enabled: !!user,
  });
}

export interface SendInvoiceInput {
  fatura_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  message?: string;
  pdf_url?: string;
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendInvoiceInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(input),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-sends'] });
      if (data.simulated) {
        toast.info('Fatura enviada em modo simulação (configure a chave API para envio real)');
      } else if (data.fallback_used) {
        toast.warning('Fatura enviada por email (fallback após falha no canal principal)');
      } else {
        toast.success('Fatura enviada com sucesso!');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar fatura: ' + error.message);
    },
  });
}

// Hook to upload PDF to storage and get public URL
export function useUploadInvoicePDF() {
  return useMutation({
    mutationFn: async ({ blob, fileName, userId }: { blob: Blob; fileName: string; userId: string }) => {
      const filePath = `${userId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
  });
}
