import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Cliente } from './useClientes';
import type { Produto } from './useProdutos';

export interface ItemFatura {
  id: string;
  fatura_id: string;
  produto_id: string;
  produto?: Produto;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  taxa_iva: number;
  subtotal: number;
  valor_iva: number;
  total: number;
  created_at: string;
}

export interface Fatura {
  id: string;
  user_id: string;
  numero: string;
  serie: string;
  tipo: 'fatura' | 'fatura-recibo' | 'recibo' | 'nota-credito' | 'proforma';
  estado: 'rascunho' | 'emitida' | 'paga' | 'anulada' | 'vencida';
  cliente_id: string;
  cliente?: Cliente;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  subtotal: number;
  total_iva: number;
  total: number;
  observacoes?: string;
  metodo_pagamento?: string;
  referencia_pagamento?: string;
  qr_code?: string;
  assinatura_digital?: string;
  itens?: ItemFatura[];
  created_at: string;
  updated_at: string;
}

export interface FaturaInput {
  tipo: Fatura['tipo'];
  cliente_id: string;
  data_emissao: string;
  data_vencimento: string;
  observacoes?: string;
  metodo_pagamento?: string;
  buyer_user_id?: string;
  buyer_faktura_id?: string;
  itens: Array<{
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    desconto: number;
    taxa_iva: number;
    subtotal: number;
    valor_iva: number;
    total: number;
  }>;
}

export function useFaturas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Fatura[];
    },
    enabled: !!user,
  });
}

export function useFatura(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['faturas', id],
    queryFn: async () => {
      const { data: fatura, error: faturaError } = await supabase
        .from('faturas')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .eq('id', id)
        .single();

      if (faturaError) throw faturaError;

      const { data: itens, error: itensError } = await supabase
        .from('itens_fatura')
        .select(`
          *,
          produto:produtos(*)
        `)
        .eq('fatura_id', id);

      if (itensError) throw itensError;

      return { ...fatura, itens } as Fatura;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateFatura() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: FaturaInput) => {
      // Generate invoice number
      const serieMap: Record<string, string> = {
        'fatura': 'FT',
        'fatura-recibo': 'FR',
        'recibo': 'RC',
        'nota-credito': 'NC',
        'proforma': 'PRO',
      };
      const serie = serieMap[input.tipo] || 'FT';

      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_invoice_number', {
          _user_id: user!.id,
          _serie: serie,
        });

      if (numeroError) throw numeroError;

      const numero = numeroData as string;
      const invoiceSerie = numero.split('/')[0];

      // Calculate totals
      const subtotal = input.itens.reduce((sum, item) => sum + item.subtotal, 0);
      const totalIva = input.itens.reduce((sum, item) => sum + item.valor_iva, 0);
      const total = input.itens.reduce((sum, item) => sum + item.total, 0);

      // Generate QR code data
      const qrData = JSON.stringify({
        numero,
        data: input.data_emissao,
        total: total.toFixed(2),
        nif: user!.id.slice(0, 9)
      });

      // Create fatura
      const insertData: Record<string, unknown> = {
        user_id: user!.id,
        numero,
        serie: invoiceSerie,
        tipo: input.tipo,
        estado: 'emitida',
        cliente_id: input.cliente_id,
        data_emissao: input.data_emissao,
        data_vencimento: input.data_vencimento,
        subtotal,
        total_iva: totalIva,
        total,
        observacoes: input.observacoes,
        metodo_pagamento: input.metodo_pagamento,
        qr_code: qrData,
      };

      if (input.buyer_user_id) {
        insertData.buyer_user_id = input.buyer_user_id;
        insertData.buyer_faktura_id = input.buyer_faktura_id;
      }

      const { data: fatura, error: faturaError } = await supabase
        .from('faturas')
        .insert(insertData as any)
        .select()
        .single();

      if (faturaError) throw faturaError;

      // Create items
      const itensToInsert = input.itens.map(item => ({
        fatura_id: fatura.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        taxa_iva: item.taxa_iva,
        subtotal: item.subtotal,
        valor_iva: item.valor_iva,
        total: item.total,
      }));

      const { error: itensError } = await supabase
        .from('itens_fatura')
        .insert(itensToInsert);

      if (itensError) throw itensError;

      return fatura;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success('Fatura criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar fatura: ' + error.message);
    },
  });
}

export function useUpdateFaturaEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, data_pagamento }: { id: string; estado: Fatura['estado']; data_pagamento?: string }) => {
      const updateData: Record<string, unknown> = { estado };
      if (data_pagamento) {
        updateData.data_pagamento = data_pagamento;
      }

      const { data, error } = await supabase
        .from('faturas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success('Estado da fatura atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar fatura: ' + error.message);
    },
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const firstDayOfYear = `${currentYear}-01-01`;

      // Get all faturas
      const { data: faturas, error } = await supabase
        .from('faturas')
        .select('*')
        .neq('estado', 'anulada');

      if (error) throw error;

      // Get clientes count
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      const faturasArray = faturas || [];

      // Calculate stats
      const faturasEmitidas = faturasArray.filter(f => f.estado === 'emitida').length;
      const faturasPendentes = faturasArray.filter(f => f.estado === 'emitida').length;
      const faturasVencidas = faturasArray.filter(f => 
        f.estado === 'emitida' && new Date(f.data_vencimento) < currentDate
      ).length;

      const faturasMes = faturasArray.filter(f => f.data_emissao >= firstDayOfMonth);
      const faturasAno = faturasArray.filter(f => f.data_emissao >= firstDayOfYear);

      const faturacaoMensal = faturasMes.reduce((sum, f) => sum + Number(f.total), 0);
      const faturacaoAnual = faturasAno.reduce((sum, f) => sum + Number(f.total), 0);
      const ivaMensal = faturasMes.reduce((sum, f) => sum + Number(f.total_iva), 0);
      const ivaAnual = faturasAno.reduce((sum, f) => sum + Number(f.total_iva), 0);

      return {
        faturacaoMensal,
        faturacaoAnual,
        ivaMensal,
        ivaAnual,
        totalClientes: totalClientes || 0,
        faturasEmitidas,
        faturasPendentes,
        faturasVencidas,
      };
    },
    enabled: !!user,
  });
}
