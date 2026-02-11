import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Fornecedor {
  id: string;
  user_id: string;
  nome: string;
  nif: string;
  endereco: string;
  telefone?: string;
  email?: string;
  tipo: string;
  created_at: string;
  updated_at: string;
}

export type FornecedorInput = Omit<Fornecedor, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useFornecedores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Fornecedor[];
    },
    enabled: !!user,
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (fornecedor: FornecedorInput) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar fornecedor: ' + error.message);
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fornecedor }: Partial<Fornecedor> & { id: string }) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar fornecedor: ' + error.message);
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor eliminado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao eliminar fornecedor: ' + error.message);
    },
  });
}
