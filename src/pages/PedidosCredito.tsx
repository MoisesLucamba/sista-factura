import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa, usePedidosCredito, useSaftUploads, useBancos } from '@/hooks/useCredito';
import { calcularScore } from '@/lib/credit-score';
import type { SaftMonth } from '@/lib/saft-parse';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Banknote, Landmark, Send, Loader2, Inbox } from 'lucide-react';

const kz = (v: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0);

export default function PedidosCredito() {
  const { user } = useAuth();
  const { data: empresa } = useEmpresa();
  const { data: uploads = [] } = useSaftUploads();
  const { data: pedidos = [] } = usePedidosCredito();
  const { data: bancos = [] } = useBancos();
  const qc = useQueryClient();

  const [valor, setValor] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [banco, setBanco] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const meses = useMemo<SaftMonth[]>(() => {
    const map = new Map<string, SaftMonth>();
    for (const u of uploads) {
      for (const m of u.vendas_por_mes ?? []) {
        const cur = map.get(m.mes) ?? { mes: m.mes, total: 0, documentos: 0 };
        cur.total += m.total; cur.documentos += m.documentos;
        map.set(m.mes, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [uploads]);

  const score = useMemo(() => calcularScore(meses), [meses]);
  const pronto = meses.length > 0 && !!empresa;

  const submeter = async () => {
    const v = Number(valor.replace(/\s/g, '').replace(',', '.'));
    if (!v || v <= 0) { toast.error('Indica o valor que pretendes.'); return; }
    setSaving(true);
    const { error } = await supabase.from('pedidos_credito').insert({
      user_id: user!.id,
      empresa_id: empresa?.id ?? null,
      banco_id: banco || null,
      valor_solicitado: v,
      valor_sugerido: score.limiteRecomendado,
      finalidade: finalidade || null,
      score_no_pedido: score.score,
      estado: 'submetido',
      dossier: {
        media_mensal: score.mediaMensal,
        volatilidade: score.volatilidade,
        crescimento_pct: score.crescimentoPct,
        meses_analisados: score.mesesAnalisados,
        classe: score.classe,
      } as unknown as never,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setValor(''); setFinalidade(''); setBanco('');
    qc.invalidateQueries({ queryKey: ['pedidos_credito'] });
    toast.success('Pedido submetido. Um analista vai receber o teu dossier.');
  };

  return (
    <MainLayout
      title="Pedir crédito"
      description="O teu dossier é montado automaticamente a partir do SAF-T validado."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" /> Novo pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pronto && (
              <p className="text-sm text-muted-foreground">
                Regista a tua empresa e envia pelo menos um SAF-T válido para poderes pedir crédito.
              </p>
            )}
            <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Limite recomendado</p>
                <p className="text-2xl font-black tabular-nums">{kz(score.limiteRecomendado)}</p>
              </div>
              <Badge>Score {score.score} · Classe {score.classe}</Badge>
            </div>

            <div className="space-y-2">
              <Label>Valor pretendido (AOA)</Label>
              <Input inputMode="decimal" placeholder="Ex.: 5000000" value={valor}
                     onChange={e => setValor(e.target.value)} disabled={!pronto} />
            </div>

            <div className="space-y-2">
              <Label>Banco parceiro (opcional)</Label>
              <Select value={banco} onValueChange={setBanco} disabled={!pronto || bancos.length === 0}>
                <SelectTrigger><SelectValue placeholder={bancos.length ? 'Escolher banco' : 'Sem bancos disponíveis'} /></SelectTrigger>
                <SelectContent>
                  {bancos.map((b: { id: string; nome: string }) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Textarea rows={3} placeholder="Compra de stock, pagamento a fornecedores, expansão..."
                        value={finalidade} onChange={e => setFinalidade(e.target.value)} disabled={!pronto} />
            </div>

            <Button className="w-full" onClick={submeter} disabled={!pronto || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submeter pedido
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" /> Dossier enviado ao banco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Empresa', empresa?.nome ?? '—'],
                ['NIF', empresa?.nif ?? '—'],
                ['Facturação média mensal', kz(score.mediaMensal)],
                ['Meses de histórico', String(score.mesesAnalisados)],
                ['Volatilidade', `${(score.volatilidade * 100).toFixed(0)}%`],
                ['Crescimento', `${score.crescimentoPct > 0 ? '+' : ''}${score.crescimentoPct}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b last:border-0 py-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Os meus pedidos</CardTitle></CardHeader>
            <CardContent>
              {pedidos.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Inbox className="w-4 h-4" /> Sem pedidos submetidos.
                </p>
              ) : (
                <div className="divide-y">
                  {pedidos.map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{kz(p.valor_solicitado)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {new Date(p.created_at).toLocaleDateString('pt-AO')} · score {p.score_no_pedido}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0">{p.estado}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
