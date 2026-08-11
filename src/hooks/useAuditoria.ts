import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditRow {
  id: string;
  data: string;
  categoria: 'Evento' | 'Decisão' | 'Desembolso';
  tipo: string;
  pme: string;
  banco: string;
  valor: number | null;
  estado: string;
  detalhe: string;
}

interface NameMaps {
  pmes: Record<string, string>;
  bancos: Record<string, string>;
}

async function carregarNomes(userIds: string[], bancoIds: string[]): Promise<NameMaps> {
  const pmes: Record<string, string> = {};
  const bancos: Record<string, string> = {};

  if (userIds.length) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, nome, instituicao_nome')
      .in('user_id', userIds);
    (data ?? []).forEach(p => {
      pmes[p.user_id] = p.instituicao_nome || p.nome || p.user_id.slice(0, 8);
    });
  }
  if (bancoIds.length) {
    const { data } = await supabase
      .from('bancos_parceiros')
      .select('id, nome')
      .in('id', bancoIds);
    (data ?? []).forEach(b => { bancos[b.id] = b.nome; });
  }
  return { pmes, bancos };
}

export function useAuditoria() {
  return useQuery({
    queryKey: ['auditoria'],
    queryFn: async (): Promise<AuditRow[]> => {
      const [ev, dec, des, ped] = await Promise.all([
        supabase.from('papel_eventos').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('credito_decisoes').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('desembolsos').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('pedidos_credito').select('id, user_id, valor_solicitado, finalidade').limit(1000),
      ]);

      const pedidos = new Map((ped.data ?? []).map(p => [p.id, p]));

      const userIds = new Set<string>();
      const bancoIds = new Set<string>();
      (ev.data ?? []).forEach(e => {
        if (e.empresa_user_id) userIds.add(e.empresa_user_id);
        if (e.banco_id) bancoIds.add(e.banco_id);
      });
      (dec.data ?? []).forEach(d => { if (d.banco_id) bancoIds.add(d.banco_id); });
      (des.data ?? []).forEach(d => {
        if (d.beneficiario_user_id) userIds.add(d.beneficiario_user_id);
        if (d.banco_id) bancoIds.add(d.banco_id);
      });
      (ped.data ?? []).forEach(p => userIds.add(p.user_id));

      const nomes = await carregarNomes([...userIds], [...bancoIds]);
      const pmeNome = (id?: string | null) => (id ? nomes.pmes[id] ?? id.slice(0, 8) : '—');
      const bancoNome = (id?: string | null) => (id ? nomes.bancos[id] ?? id.slice(0, 8) : '—');

      const rows: AuditRow[] = [];

      (ev.data ?? []).forEach(e => {
        const payload = (e.payload ?? {}) as Record<string, unknown>;
        rows.push({
          id: `ev-${e.id}`,
          data: e.created_at,
          categoria: 'Evento',
          tipo: e.tipo,
          pme: pmeNome(e.empresa_user_id),
          banco: bancoNome(e.banco_id),
          valor: typeof payload.valor === 'number' ? payload.valor
            : typeof payload.valor_aprovado === 'number' ? payload.valor_aprovado : null,
          estado: String(payload.estado ?? payload.decisao ?? '—'),
          detalhe: String(payload.observacoes ?? payload.iban ?? ''),
        });
      });

      (dec.data ?? []).forEach(d => {
        const p = pedidos.get(d.pedido_id);
        rows.push({
          id: `dec-${d.id}`,
          data: d.created_at,
          categoria: 'Decisão',
          tipo: `Decisão de crédito · ${d.decisao}`,
          pme: pmeNome(p?.user_id),
          banco: bancoNome(d.banco_id),
          valor: d.valor_aprovado !== null ? Number(d.valor_aprovado) : null,
          estado: d.decisao,
          detalhe: [d.observacoes, d.prazo_meses ? `${d.prazo_meses} meses` : null, d.taxa_juro ? `${d.taxa_juro}%` : null]
            .filter(Boolean).join(' · '),
        });
      });

      (des.data ?? []).forEach(d => {
        rows.push({
          id: `des-${d.id}`,
          data: d.created_at,
          categoria: 'Desembolso',
          tipo: 'Desembolso',
          pme: pmeNome(d.beneficiario_user_id),
          banco: bancoNome(d.banco_id),
          valor: Number(d.valor),
          estado: d.estado,
          detalhe: [d.referencia, d.iban_destino, d.banco_destino].filter(Boolean).join(' · '),
        });
      });

      return rows.sort((a, b) => (a.data < b.data ? 1 : -1));
    },
  });
}
