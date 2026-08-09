import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SeguroPedido {
  id: string;
  user_id: string;
  empresa_id: string | null;
  tipo: string;
  valor_seguro: number;
  num_trabalhadores: number;
  actividade: string | null;
  contacto: string | null;
  notas: string | null;
  estado: string;
  created_at: string;
}

export interface NovoSeguroPedido {
  tipo: string;
  valor_seguro: number;
  num_trabalhadores: number;
  actividade: string | null;
  contacto: string | null;
  notas: string | null;
  empresa_id: string | null;
}

export function useSegurosPedidos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seguros_pedidos', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seguros_pedidos' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SeguroPedido[];
    },
  });
}

export function useCriarSeguroPedido() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: NovoSeguroPedido) => {
      const { error } = await supabase
        .from('seguros_pedidos' as never)
        .insert({ ...values, user_id: user!.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seguros_pedidos'] });
      toast.success('Pedido de seguro enviado. Entramos em contacto em breve.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
