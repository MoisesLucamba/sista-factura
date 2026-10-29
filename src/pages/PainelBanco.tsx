import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMeuBanco, usePedidosBanco, useDecidirPedido, useDesembolsosBanco,
  useActualizarDesembolso, useGiroEventos, PedidoBanco,
} from '@/hooks/useBanco';
import { formatCurrency } from '@/lib/format';
import {
  Landmark, Gauge, TrendingUp, CheckCircle2, XCircle, HelpCircle,
  Banknote, Activity, CalendarClock, Loader2,
} from 'lucide-react';

const estadoBadge: Record<string, string> = {
  pendente: 'bg-muted text-muted-foreground',
  aprovado: 'bg-primary/15 text-primary',
  rejeitado: 'bg-destructive/15 text-destructive',
  mais_info: 'bg-secondary text-secondary-foreground',
  em_curso: 'bg-primary/15 text-primary',
  pago: 'bg-primary/15 text-primary',
  incumprido: 'bg-destructive/15 text-destructive',
};

function melhorMomento(dossier: Record<string, unknown> | null): string {
  const meses = (dossier?.vendas_por_mes as { mes: string; total: number }[] | undefined) ?? [];
  if (!meses.length) return 'Sem histórico de sazonalidade suficiente para recomendar um momento.';
  const pico = meses.reduce((a, b) => (b.total > a.total ? b : a));
  const vale = meses.reduce((a, b) => (b.total < a.total ? b : a));
  return `Pico de vendas em ${pico.mes} e mínimo em ${vale.mes}. O capital de giro rende mais se for desembolsado antes do pico, para financiar stock e operação.`;
}

export default function PainelBanco() {
  const { data: banco, isLoading: loadingBanco } = useMeuBanco();
  const { data: pedidos = [], isLoading } = usePedidosBanco(banco?.id);
  const { data: desembolsos = [] } = useDesembolsosBanco(banco?.id);
  const { data: eventos = [] } = useGiroEventos(banco?.id);
  const decidir = useDecidirPedido();
  const actualizar = useActualizarDesembolso();

  const [seleccionado, setSeleccionado] = useState<PedidoBanco | null>(null);
  const [obs, setObs] = useState('');
  const [valor, setValor] = useState('');

  if (loadingBanco) {
    return <MainLayout><div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></MainLayout>;
  }

  if (!banco) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto text-center py-20 space-y-3">
          <Landmark className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-black">Painel do Banco</h1>
          <p className="text-muted-foreground">
            Esta área é exclusiva para instituições financeiras registadas no Giro. A tua conta
            ainda não está associada a nenhuma instituição parceira.
          </p>
        </div>
      </MainLayout>
    );
  }

  const totalConcedido = desembolsos.reduce((s, d) => s + Number(d.valor || 0), 0);

  const agir = (decisao: 'aprovado' | 'rejeitado' | 'mais_info') => {
    if (!seleccionado) return;
    decidir.mutate({
      pedido: seleccionado,
      bancoId: banco.id,
      decisao,
      observacoes: obs,
      valorAprovado: decisao === 'aprovado'
        ? Number(valor || seleccionado.valor_solicitado)
        : undefined,
    }, { onSuccess: () => { setSeleccionado(null); setObs(''); setValor(''); } });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> {banco.nome}
          </h1>
          <p className="text-muted-foreground text-sm">
            Pedidos originados pelo Giro. Cada decisão e cada pagamento fica registado no Giro.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Activity, label: 'Pedidos recebidos', valor: String(pedidos.length) },
            { icon: Banknote, label: 'Crédito concedido', valor: formatCurrency(totalConcedido) },
            { icon: CalendarClock, label: 'Em curso', valor: String(desembolsos.filter(d => d.estado === 'em_curso' || d.estado === 'pendente').length) },
          ].map(({ icon: I, label, valor: v }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5">
              <I className="w-4 h-4 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-black">{v}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pedidos">
          <TabsList>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="creditos">Créditos concedidos</TabsTrigger>
            <TabsTrigger value="eventos">Registo Giro</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="mt-4">
            {isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : pedidos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Ainda não recebeste pedidos de financiamento através do Giro.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="space-y-3">
                  {pedidos.map(p => (
                    <button key={p.id} onClick={() => { setSeleccionado(p); setObs(p.notas_analista ?? ''); setValor(String(p.valor_solicitado)); }}
                            className={`w-full text-left rounded-2xl border p-4 transition-colors ${seleccionado?.id === p.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{formatCurrency(Number(p.valor_solicitado))}</p>
                          <p className="text-xs text-muted-foreground">{p.finalidade || 'Capital de giro'}</p>
                        </div>
                        <Badge className={estadoBadge[p.estado] ?? ''} variant="secondary">{p.estado}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3 text-primary" /> Giro Score {p.score_no_pedido ?? '—'}</span>
                        <span>{new Date(p.created_at).toLocaleDateString('pt-AO')}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  {!seleccionado ? (
                    <p className="text-sm text-muted-foreground">Selecciona um pedido para avaliar.</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor solicitado</p>
                        <p className="text-2xl font-black">{formatCurrency(Number(seleccionado.valor_solicitado))}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-[11px] text-muted-foreground">Giro Score</p>
                          <p className="font-black text-lg">{seleccionado.score_no_pedido ?? '—'}</p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-[11px] text-muted-foreground">Limite sugerido</p>
                          <p className="font-black text-lg">{seleccionado.valor_sugerido ? formatCurrency(Number(seleccionado.valor_sugerido)) : '—'}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                        <p className="text-xs font-bold text-primary inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Melhor momento para conceder
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {melhorMomento(seleccionado.dossier)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor a aprovar (Kz)</Label>
                        <Input id="valor" inputMode="numeric" value={valor} onChange={e => setValor(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="obs">Observações</Label>
                        <Textarea id="obs" value={obs} onChange={e => setObs(e.target.value)}
                                  placeholder="Fundamentação da decisão, documentos em falta, condições…" />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button onClick={() => agir('aprovado')} disabled={decidir.isPending} className="font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button onClick={() => agir('mais_info')} disabled={decidir.isPending} variant="secondary">
                          <HelpCircle className="w-4 h-4 mr-1" /> Mais info
                        </Button>
                        <Button onClick={() => agir('rejeitado')} disabled={decidir.isPending} variant="outline">
                          <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                        </Button>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Ao aprovar, o desembolso é criado automaticamente para o IBAN da PME e executado
                        através da infra-estrutura do Giro, que regista todo o fluxo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="creditos" className="mt-4 space-y-3">
            {desembolsos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Ainda não há créditos concedidos.</p>
            ) : desembolsos.map(d => (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{formatCurrency(Number(d.valor))}</p>
                  <p className="text-xs text-muted-foreground">
                    IBAN {d.iban_destino || '—'} · {d.banco_destino || 'Banco não indicado'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={estadoBadge[d.estado] ?? ''}>{d.estado}</Badge>
                  {d.estado !== 'pago' && (
                    <Button size="sm" variant="outline" onClick={() => actualizar.mutate({ id: d.id, estado: 'em_curso' })}>Em curso</Button>
                  )}
                  {d.estado !== 'pago' && (
                    <Button size="sm" onClick={() => actualizar.mutate({ id: d.id, estado: 'pago' })}>Marcar pago</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => actualizar.mutate({ id: d.id, estado: 'incumprido' })}>Incumprido</Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="eventos" className="mt-4 space-y-2">
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Sem eventos registados.</p>
            ) : eventos.map((e: { id: string; tipo: string; created_at: string }) => (
              <div key={e.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-semibold">{e.tipo.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('pt-AO')}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
