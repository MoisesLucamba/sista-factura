import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useConvertProforma() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proformaId: string) => {
      if (!user) throw new Error('Não autenticado');

      // Get the proforma with items
      const { data: proforma, error: pErr } = await supabase
        .from('faturas')
        .select('*, cliente:clientes(*)')
        .eq('id', proformaId)
        .single();
      if (pErr) throw pErr;
      if (proforma.tipo !== 'proforma') throw new Error('Documento não é uma proforma');

      const { data: itens, error: iErr } = await supabase
        .from('itens_fatura')
        .select('*')
        .eq('fatura_id', proformaId);
      if (iErr) throw iErr;

      // Generate new invoice number with FT series
      const { data: numero, error: nErr } = await supabase
        .rpc('generate_invoice_number', { _user_id: user.id, _serie: 'FT' });
      if (nErr) throw nErr;

      // Create the official invoice
      const { data: fatura, error: fErr } = await supabase
        .from('faturas')
        .insert({
          user_id: user.id,
          numero: numero as string,
          serie: 'FT',
          tipo: 'fatura',
          estado: 'emitida',
          cliente_id: proforma.cliente_id,
          data_emissao: new Date().toISOString().split('T')[0],
          data_vencimento: proforma.data_vencimento,
          subtotal: proforma.subtotal,
          total_iva: proforma.total_iva,
          total: proforma.total,
          observacoes: `Convertida da proforma ${proforma.numero}` + (proforma.observacoes ? `\n${proforma.observacoes.replace('DOCUMENTO PROFORMA – NÃO VÁLIDO COMO DOCUMENTO FISCAL\n', '')}` : ''),
          metodo_pagamento: proforma.metodo_pagamento,
          qr_code: JSON.stringify({ numero: numero as string, data: new Date().toISOString().split('T')[0], total: proforma.total }),
        })
        .select()
        .single();
      if (fErr) throw fErr;

      // Copy items
      if (itens && itens.length > 0) {
        const newItens = itens.map(item => ({
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
        const { error: iiErr } = await supabase.from('itens_fatura').insert(newItens);
        if (iiErr) throw iiErr;
      }

      // Record conversion
      const { error: cErr } = await supabase
        .from('proforma_conversions')
        .insert({
          proforma_id: proformaId,
          fatura_id: fatura.id,
          user_id: user.id,
          notes: `Proforma ${proforma.numero} convertida em Fatura ${numero}`,
        });
      if (cErr) throw cErr;

      return { proforma, fatura };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      toast.success(`Proforma convertida em Fatura ${data.fatura.numero}!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao converter proforma: ' + error.message);
    },
  });
}

export function useProformaConversions(proformaId?: string) {
  return useQuery({
    queryKey: ['proforma-conversions', proformaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proforma_conversions')
        .select('*')
        .eq('proforma_id', proformaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!proformaId,
  });
}
