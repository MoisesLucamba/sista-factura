import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AgtConfig {
  id: string;
  user_id: string;
  certificate_number?: string;
  certificate_status: string;
  certificate_valid_until?: string;
  public_key?: string;
  nif_produtor?: string;
  nome_empresa?: string;
  endereco_empresa?: string;
  modelo_8_reference?: string;
  memoria_descritiva_reference?: string;
  declaracao_conformidade_reference?: string;
  default_send_channel: 'whatsapp' | 'sms' | 'email';
  auto_send_invoice: boolean;
  invoice_language: string;
  created_at: string;
  updated_at: string;
}

export interface AgtConfigInput {
  certificate_number?: string;
  certificate_status?: string;
  certificate_valid_until?: string;
  public_key?: string;
  nif_produtor?: string;
  nome_empresa?: string;
  endereco_empresa?: string;
  modelo_8_reference?: string;
  memoria_descritiva_reference?: string;
  declaracao_conformidade_reference?: string;
  default_send_channel?: 'whatsapp' | 'sms' | 'email';
  auto_send_invoice?: boolean;
  invoice_language?: string;
}

export function useAgtConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agt-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agt_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as AgtConfig | null;
    },
    enabled: !!user,
  });
}

export function useCreateOrUpdateAgtConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: AgtConfigInput) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from('agt_config')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('agt_config')
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user!.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create
        const { data, error } = await supabase
          .from('agt_config')
          .insert({
            user_id: user!.id,
            ...input,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agt-config'] });
      toast.success('Configurações AGT guardadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao guardar configurações: ' + error.message);
    },
  });
}
