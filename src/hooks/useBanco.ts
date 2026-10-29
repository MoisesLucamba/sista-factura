import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PedidoBanco {
  id: string;
  user_id: string;
  valor_solicitado: number;
  valor_sugerido: number | null;
  finalidade: string | null;
  score_no_pedido: number | null;
  estado: string;
  banco_id: string | null;
  notas_analista: string | null;
  dossier: Record<string, unknown> | null;
  created_at: string;
}

export function useMeuBanco() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['meu_banco', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bancos_parceiros')
        .select('*')
        .eq('owner_user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePedidosBanco(bancoId?: string) {
  return useQuery({
    queryKey: ['pedidos_banco', bancoId],
    enabled: !!bancoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_credito')
        .select('*')
        .eq('banco_id', bancoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PedidoBanco[];
    },
  });
}

export function useDecidirPedido() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pedido: PedidoBanco;
      bancoId: string;
      decisao: 'aprovado' | 'rejeitado' | 'mais_info';
      observacoes: string;
      valorAprovado?: number;
      prazoMeses?: number;
      taxaJuro?: number;
    }) => {
      const { data: decisao, error } = await supabase.from('credito_decisoes').insert({
        pedido_id: input.pedido.id,
        banco_id: input.bancoId,
        decidido_por: user!.id,
        decisao: input.decisao,
        observacoes: input.observacoes || null,
        valor_aprovado: input.valorAprovado ?? null,
        prazo_meses: input.prazoMeses ?? null,
        taxa_juro: input.taxaJuro ?? null,
      }).select().single();
      if (error) throw error;

      if (input.decisao === 'aprovado') {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('iban, banco')
          .eq('user_id', input.pedido.user_id)
          .maybeSingle();

        const { error: dErr } = await supabase.from('desembolsos').insert({
          pedido_id: input.pedido.id,
          decisao_id: decisao.id,
          banco_id: input.bancoId,
          beneficiario_user_id: input.pedido.user_id,
          iban_destino: empresa?.iban ?? null,
          banco_destino: empresa?.banco ?? null,
          valor: input.valorAprovado ?? input.pedido.valor_solicitado,
          estado: 'pendente',
        });
        if (dErr) throw dErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos_banco'] });
      qc.invalidateQueries({ queryKey: ['desembolsos_banco'] });
      qc.invalidateQueries({ queryKey: ['papel_eventos'] });
      toast.success('Decisão registada no Giro.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface Desembolso {
  id: string;
  pedido_id: string;
  valor: number;
  estado: string;
  iban_destino: string | null;
  banco_destino: string | null;
  referencia: string | null;
  pago_em: string | null;
  created_at: string;
}

export function useDesembolsosBanco(bancoId?: string) {
  return useQuery({
    queryKey: ['desembolsos_banco', bancoId],
    enabled: !!bancoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('desembolsos')
        .select('*')
        .eq('banco_id', bancoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Desembolso[];
    },
  });
}

export function useActualizarDesembolso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase
        .from('desembolsos')
        .update({ estado, pago_em: estado === 'pago' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['desembolsos_banco'] });
      qc.invalidateQueries({ queryKey: ['papel_eventos'] });
      toast.success('Estado actualizado e registado no Giro.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGiroEventos(bancoId?: string) {
  return useQuery({
    queryKey: ['papel_eventos', bancoId],
    enabled: !!bancoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('papel_eventos')
        .select('*')
        .eq('banco_id', bancoId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
