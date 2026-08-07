import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEmpresa, useSaftUploads, usePedidosCredito } from '@/hooks/useCredito';
import { calcularScore, classeLabel } from '@/lib/credit-score';
import type { SaftMonth } from '@/lib/saft-parse';
import {
  Upload, TrendingUp, Gauge, Banknote, Building2, CalendarRange,
  ArrowRight, AlertCircle, FileCheck2,
} from 'lucide-react';

const kz = (v: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0);

export default function Dashboard() {
  const { data: empresa } = useEmpresa();
  const { data: uploads = [], isLoading } = useSaftUploads();
  const { data: pedidos = [] } = usePedidosCredito();

  const meses = useMemo<SaftMonth[]>(() => {
    const map = new Map<string, SaftMonth>();
    for (const u of uploads) {
      for (const m of u.vendas_por_mes ?? []) {
        const cur = map.get(m.mes) ?? { mes: m.mes, total: 0, documentos: 0 };
        cur.total += m.total;
        cur.documentos += m.documentos;
        map.set(m.mes, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [uploads]);

  const score = useMemo(() => calcularScore(meses), [meses]);
  const temDados = meses.length > 0;
  const maxMes = Math.max(1, ...meses.map(m => m.total));

  const breakdownItems = [
    { label: 'Volume de facturação', valor: score.breakdown.volume, max: 30 },
    { label: 'Consistência mensal', valor: score.breakdown.consistencia, max: 25 },
    { label: 'Crescimento', valor: score.breakdown.crescimento, max: 20 },
    { label: 'Histórico enviado', valor: score.breakdown.historico, max: 15 },
    { label: 'Conformidade fiscal', valor: score.breakdown.conformidade, max: 10 },
  ];

  return (
    <MainLayout
      title="O teu capital de giro"
      description="O teu histórico de faturação, transformado em acesso a crédito."
      loading={isLoading}
    >
      <div className="space-y-6">
        {!empresa && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
              <Building2 className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Regista a tua empresa</p>
                <p className="text-sm text-muted-foreground">
                  Precisamos do NIF para validar os teus ficheiros SAF-T.
                </p>
              </div>
              <Button asChild><Link to="/empresa">Registar empresa</Link></Button>
            </CardContent>
          </Card>
        )}

        {!temDados && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center text-center gap-4 py-12">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">Envia o teu primeiro SAF-T</p>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Exporta o SAF-T (AO) do software que já usas e envia-o aqui. Em segundos calculamos
                  o teu score e o limite de crédito recomendado.
                </p>
              </div>
              <Button asChild size="lg"><Link to="/saft">Enviar SAF-T <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
            </CardContent>
          </Card>
        )}

        {temDados && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Gauge className="w-4 h-4" /> Score de crédito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-black tabular-nums">{score.score}</span>
                    <span className="text-muted-foreground mb-2 text-sm">/ 1000</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="text-sm">Classe {score.classe}</Badge>
                    <span className="text-sm text-muted-foreground">{classeLabel[score.classe]}</span>
                  </div>
                  <Progress value={score.score / 10} className="mt-4" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Banknote className="w-4 h-4" /> Limite recomendado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black tabular-nums">{kz(score.limiteRecomendado)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Até {score.prazoMeses} meses · taxa indicativa {score.taxaMensal}%/mês
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/credito">Pedir crédito</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Facturação média
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-black tabular-nums">{kz(score.mediaMensal)}</p>
                  <p className="text-sm text-muted-foreground">por mês · {score.mesesAnalisados} meses analisados</p>
                  <p className="text-sm">
                    Crescimento:{' '}
                    <span className={score.crescimentoPct >= 0 ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
                      {score.crescimentoPct > 0 ? '+' : ''}{score.crescimentoPct}%
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-primary" /> Sazonalidade da facturação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1.5 h-40">
                    {meses.map(m => (
                      <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t-md bg-primary/80 group-hover:bg-primary transition-colors"
                          style={{ height: `${Math.max(4, (m.total / maxMes) * 100)}%` }}
                          title={`${m.mes}: ${kz(m.total)}`}
                        />
                        <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                          {m.mes.slice(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-6">
                    Volatilidade: {(score.volatilidade * 100).toFixed(0)}% — quanto mais estável, maior o limite.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-primary" /> Como o score é calculado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {breakdownItems.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span className="font-bold tabular-nums">{item.valor} / {item.max}</span>
                      </div>
                      <Progress value={(item.valor / item.max) * 100} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pedidos de crédito</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/credito">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Ainda não fizeste nenhum pedido.
              </p>
            ) : (
              <div className="divide-y">
                {pedidos.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold">{kz(p.valor_solicitado)}</p>
                      <p className="text-xs text-muted-foreground">{p.finalidade || 'Capital de giro'}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{p.estado}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
