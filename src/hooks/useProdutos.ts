import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Produto {
  id: string;
  user_id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: 'produto' | 'servico';
  preco_unitario: number;
  unidade: string;
  iva_incluido: boolean;
  taxa_iva: number;
  stock?: number;
  stock_minimo?: number;
  created_at: string;
  updated_at: string;
}

export type ProdutoInput = Omit<Produto, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useProdutos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!user,
  });
}

export function useProduto(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['produtos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Produto;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (produto: ProdutoInput) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert({ ...produto, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...produto }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto eliminado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao eliminar produto: ' + error.message);
    },
  });
}
