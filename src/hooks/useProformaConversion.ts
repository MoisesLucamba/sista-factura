import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateAGTHash } from '@/lib/agt-hash';
import { generateDocumentHash, buildAgtQrPayload } from '@/lib/invoice-signing';
import { getPeriodoContabilistico } from '@/lib/agt-constants';

export function useConvertProforma() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proformaId: string) => {
      if (!user) throw new Error('Não autenticado');

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

      const { data: numero, error: nErr } = await supabase
        .rpc('generate_invoice_number', { _user_id: user.id, _serie: 'FT' });
      if (nErr) throw nErr;
      const numeroStr = numero as string;
      const invoiceSerie = 'FT';

      // AGT config
      const { data: agt } = await supabase
        .from('agt_config').select('nif_produtor, certificate_number')
        .eq('user_id', user.id).maybeSingle();
      const nifEmitente = agt?.nif_produtor || '000000000';
      const nifCliente = (proforma.cliente as any)?.nif || '999999999';

      // Hash chain — previous FT
      const { data: previousInvoice } = await supabase
        .from('faturas')
        .select('hash_doc, signature_hash')
        .eq('user_id', user.id)
        .eq('serie', invoiceSerie)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const previousHash = (previousInvoice as any)?.hash_doc || (previousInvoice as any)?.signature_hash || '0';

      const dataEmissao = new Date().toISOString().split('T')[0];
      const systemEntryDate = new Date().toISOString();

      const agtHashRes = await generateAGTHash({
        dataEmissao,
        dataHoraSistema: systemEntryDate,
        numeroDocumento: numeroStr,
        totalBruto: Number(proforma.total),
        hashAnterior: previousHash,
      });

      const signatureHash = await generateDocumentHash({
        numero: numeroStr,
        data_emissao: dataEmissao,
        tipo: 'fatura',
        subtotal: Number(proforma.subtotal),
        total_iva: Number(proforma.total_iva),
        total: Number(proforma.total),
        nif_emitente: nifEmitente,
        nif_cliente: nifCliente,
        previous_hash: previousHash,
      });

      const atcud = `${invoiceSerie}-${numeroStr.split('/')[2] || '000001'}`;
      const qrData = buildAgtQrPayload({
        nif_emitente: nifEmitente,
        nif_cliente: nifCliente,
        tipo: 'fatura',
        estado: 'emitida',
        data_emissao: dataEmissao,
        numero: numeroStr,
        atcud,
        subtotal: Number(proforma.subtotal),
        total_iva: Number(proforma.total_iva),
        total: Number(proforma.total),
        hash_4chars: agtHashRes.extracto4Chars,
      });

      const { data: fatura, error: fErr } = await supabase
        .from('faturas')
        .insert({
          user_id: user.id,
          numero: numeroStr,
          serie: invoiceSerie,
          tipo: 'fatura',
          estado: 'emitida',
          cliente_id: proforma.cliente_id,
          data_emissao: dataEmissao,
          data_vencimento: proforma.data_vencimento,
          subtotal: proforma.subtotal,
          total_iva: proforma.total_iva,
          total: proforma.total,
          observacoes: `Convertida da proforma ${proforma.numero}` + (proforma.observacoes ? `\n${proforma.observacoes.replace('DOCUMENTO PROFORMA – NÃO VÁLIDO COMO DOCUMENTO FISCAL\n', '')}` : ''),
          metodo_pagamento: proforma.metodo_pagamento,
          qr_code: qrData,
          signature_hash: signatureHash,
          certificate_number: agt?.certificate_number || '',
          is_locked: true,
          hash_doc: agtHashRes.hashCompleto,
          hash_extracto: agtHashRes.extracto4Chars,
          hash_anterior: previousHash,
          periodo_contabilistico: getPeriodoContabilistico(dataEmissao),
          system_entry_date: systemEntryDate,
          // AGT Point 9 — OrderReferences for converted proforma
          order_reference_id: proforma.id,
          order_reference_numero: proforma.numero,
          moeda: proforma.moeda || 'AOA',
          taxa_cambio: proforma.taxa_cambio || 1,
          incluir_saft: true,
        })
        .select()
        .single();
      if (fErr) throw fErr;

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
          tax_exemption_code: (item as any).tax_exemption_code || null,
          tax_exemption_reason: (item as any).tax_exemption_reason || null,
        }));
        const { error: iiErr } = await supabase.from('itens_fatura').insert(newItens);
        if (iiErr) throw iiErr;
      }

      const { error: cErr } = await supabase
        .from('proforma_conversions')
        .insert({
          proforma_id: proformaId,
          fatura_id: fatura.id,
          user_id: user.id,
          notes: `Proforma ${proforma.numero} convertida em Fatura ${numeroStr}`,
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
