import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SaftMonth, SaftProduto } from '@/lib/saft-parse';

export interface Empresa {
  id: string;
  user_id: string;
  nif: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  software_certificado: string | null;
  software_cert_number: string | null;
  iban: string | null;
  banco: string | null;
}

export interface SaftUpload {
  id: string;
  file_name: string;
  periodo_label: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  nif_ficheiro: string | null;
  total_vendas: number;
  num_documentos: number;
  vendas_por_mes: SaftMonth[] | null;
  produtos: SaftProduto[] | null;
  estado: string;
  created_at: string;
}

export interface PedidoCredito {
  id: string;
  valor_solicitado: number;
  valor_sugerido: number | null;
  finalidade: string | null;
  score_no_pedido: number | null;
  estado: string;
  banco_id: string | null;
  notas_analista: string | null;
  created_at: string;
}

export function useEmpresa() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['empresa', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Empresa | null;
    },
  });
}

export function useSaveEmpresa() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Empresa> & { nif: string; nome: string }) => {
      const { data: existing } = await supabase
        .from('empresas').select('id').eq('user_id', user!.id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('empresas').update(values).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('empresas').insert({ ...values, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresa'] });
      toast.success('Dados da empresa guardados.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaftUploads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saft_uploads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saft_uploads')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SaftUpload[];
    },
  });
}

export function useScoreHistorico() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['score_historico', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('score_historico')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePedidosCredito() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pedidos_credito', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_credito')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PedidoCredito[];
    },
  });
}

export function useBancos() {
  return useQuery({
    queryKey: ['bancos_parceiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bancos_parceiros')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });
}
