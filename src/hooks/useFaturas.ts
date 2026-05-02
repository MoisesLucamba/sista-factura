import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Cliente } from './useClientes';
import type { Produto } from './useProdutos';
import { generateDocumentHash, signDocumentHash, buildAgtQrPayload } from '@/lib/invoice-signing';
import { generateAGTHash } from '@/lib/agt-hash';
import { getPeriodoContabilistico, DOCUMENT_TYPES, type TipoDocumentoAGT } from '@/lib/agt-constants';

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
  tipo: TipoDocumentoAGT;
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
  signature_hash?: string;
  buyer_user_id?: string;
  buyer_faktura_id?: string;
  certificate_number?: string;
  // AGT 312/18
  hash_doc?: string;
  hash_extracto?: string;
  hash_anterior?: string;
  periodo_contabilistico?: string;
  system_entry_date?: string;
  desconto_global?: number;
  desconto_global_valor?: number;
  moeda?: string;
  taxa_cambio?: number;
  order_reference_id?: string;
  order_reference_numero?: string;
  guia_morada_carga?: string;
  guia_morada_descarga?: string;
  guia_matricula_viatura?: string;
  guia_data_transporte?: string;
  periodo_global_inicio?: string;
  periodo_global_fim?: string;
  incluir_saft?: boolean;
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
  // AGT 312/18 — optional
  desconto_global?: number;
  moeda?: string;
  taxa_cambio?: number;
  order_reference_id?: string;
  order_reference_numero?: string;
  guia_morada_carga?: string;
  guia_morada_descarga?: string;
  guia_matricula_viatura?: string;
  guia_data_transporte?: string;
  periodo_global_inicio?: string;
  periodo_global_fim?: string;
  itens: Array<{
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    desconto: number;
    taxa_iva: number;
    subtotal: number;
    valor_iva: number;
    total: number;
    tax_exemption_code?: string;
    tax_exemption_reason?: string;
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
      // REGRA 2 — Series for all SAF-T document types
      const docTypeMeta = DOCUMENT_TYPES[input.tipo as TipoDocumentoAGT];
      const serie = docTypeMeta?.saft || 'FT';
      const incluirSaft = docTypeMeta?.fiscal !== false; // proforma/orcamento: false

      // REGRA 3 — Validate IVA exemption codes
      for (const it of input.itens) {
        if (Number(it.taxa_iva) === 0 && incluirSaft && !it.tax_exemption_code) {
          throw new Error(
            'Para itens isentos de IVA (0%), é obrigatório indicar o código de isenção (M00...M38) conforme o CIVA.'
          );
        }
      }

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

      // Fetch AGT config for NIF and certificate
      const { data: agtConfig } = await supabase
        .from('agt_config')
        .select('nif_produtor, certificate_number, public_key')
        .eq('user_id', user!.id)
        .maybeSingle();

      const nifEmitente = agtConfig?.nif_produtor || '000000000';
      const certificateNumber = agtConfig?.certificate_number || '';

      // Fetch client NIF
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('nif')
        .eq('id', input.cliente_id)
        .single();
      const nifCliente = clienteData?.nif || '999999999';

      // REGRA 5 — Apply global discount
      const descontoGlobalPct = Number(input.desconto_global || 0);
      const descontoGlobalValor = subtotal * (descontoGlobalPct / 100);

      // Hash Chain (REGRA 1): fetch previous AGT hash in the same series
      const { data: previousInvoice } = await supabase
        .from('faturas')
        .select('hash_doc, signature_hash')
        .eq('user_id', user!.id)
        .eq('serie', invoiceSerie)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const previousHash = (previousInvoice as any)?.hash_doc || previousInvoice?.signature_hash || '0';

      // REGRA 1 + 9 — AGT hash with system entry date
      const systemEntryDate = new Date().toISOString();
      const agtHashRes = await generateAGTHash({
        dataEmissao: input.data_emissao,
        dataHoraSistema: systemEntryDate,
        numeroDocumento: numero,
        totalBruto: total,
        hashAnterior: previousHash,
      });

      // Legacy invoice-signing (kept for backwards compatibility)
      const documentHash = await generateDocumentHash({
        numero,
        data_emissao: input.data_emissao,
        tipo: input.tipo,
        subtotal,
        total_iva: totalIva,
        total,
        nif_emitente: nifEmitente,
        nif_cliente: nifCliente,
        previous_hash: previousHash,
      });

      const signatureHash = documentHash;

      // Generate ATCUD
      const atcud = `${invoiceSerie}-${numero.split('/')[2] || '000001'}`;

      // Build AGT-compliant QR code (use Base64 4-char extract from AGT hash)
      const qrData = buildAgtQrPayload({
        nif_emitente: nifEmitente,
        nif_cliente: nifCliente,
        tipo: input.tipo,
        estado: 'emitida',
        data_emissao: input.data_emissao,
        numero,
        atcud,
        subtotal,
        total_iva: totalIva,
        total,
        hash_4chars: agtHashRes.extracto4Chars,
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
        signature_hash: signatureHash,
        certificate_number: certificateNumber,
        is_locked: true,
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

      // Previous month
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const firstDayPrevMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      const lastDayPrevMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

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
      const faturasMesAnterior = faturasArray.filter(f => f.data_emissao >= firstDayPrevMonth && f.data_emissao < lastDayPrevMonth);
      const faturasAno = faturasArray.filter(f => f.data_emissao >= firstDayOfYear);

      const faturacaoMensal = faturasMes.reduce((sum, f) => sum + Number(f.total), 0);
      const faturacaoMesAnterior = faturasMesAnterior.reduce((sum, f) => sum + Number(f.total), 0);
      const faturacaoAnual = faturasAno.reduce((sum, f) => sum + Number(f.total), 0);
      const ivaMensal = faturasMes.reduce((sum, f) => sum + Number(f.total_iva), 0);
      const ivaAnual = faturasAno.reduce((sum, f) => sum + Number(f.total_iva), 0);

      // Trend calculation
      const trendPercentage = faturacaoMesAnterior > 0
        ? Math.round(((faturacaoMensal - faturacaoMesAnterior) / faturacaoMesAnterior) * 100)
        : faturacaoMensal > 0 ? 100 : 0;

      return {
        faturacaoMensal,
        faturacaoAnual,
        faturacaoMesAnterior,
        trendPercentage,
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
