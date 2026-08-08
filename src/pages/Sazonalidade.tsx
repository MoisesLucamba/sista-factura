import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSaftUploads } from '@/hooks/useCredito';
import type { SaftProduto } from '@/lib/saft-parse';
import {
  TrendingUp, TrendingDown, PackageSearch, CalendarClock, Boxes, Info,
} from 'lucide-react';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const kz = (v: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0);

interface ProdutoAgregado {
  codigo: string;
  descricao: string;
  quantidade: number;
  total: number;
  meses: number[];      // índice 0-11 com quantidade acumulada
}

export default function Sazonalidade() {
  const { data: uploads = [], isLoading } = useSaftUploads();
  const [busca, setBusca] = useState('');

  const produtos = useMemo<ProdutoAgregado[]>(() => {
    const mapa = new Map<string, ProdutoAgregado>();
    for (const up of uploads) {
      const lista = (up.produtos ?? []) as SaftProduto[];
      for (const p of lista) {
        const key = (p.codigo || p.descricao).toLowerCase();
        const cur = mapa.get(key) ?? {
          codigo: p.codigo,
          descricao: p.descricao,
          quantidade: 0,
          total: 0,
          meses: Array(12).fill(0) as number[],
        };
        cur.quantidade += Number(p.quantidade) || 0;
        cur.total += Number(p.total) || 0;
        for (const [mes, qtd] of Object.entries(p.porMes ?? {})) {
          const idx = Number(mes.slice(5, 7)) - 1;
          if (idx >= 0 && idx < 12) cur.meses[idx] += Number(qtd) || 0;
        }
        mapa.set(key, cur);
      }
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [uploads]);

  const filtrados = useMemo(
    () => produtos.filter(p => !busca || p.descricao.toLowerCase().includes(busca.toLowerCase())),
    [produtos, busca],
  );

  // Sazonalidade global (soma de todos os produtos)
  const globalMeses = useMemo(() => {
    const acc = Array(12).fill(0) as number[];
    for (const p of produtos) p.meses.forEach((q, i) => { acc[i] += q; });
    return acc;
  }, [produtos]);

  const temDados = produtos.length > 0 && globalMeses.some(v => v > 0);
  const picoIdx = temDados ? globalMeses.indexOf(Math.max(...globalMeses)) : -1;
  const mesesComDados = globalMeses.map((v, i) => ({ v, i })).filter(m => m.v > 0);
  const escassezIdx = mesesComDados.length
    ? mesesComDados.reduce((a, b) => (b.v < a.v ? b : a)).i
    : -1;
  const melhorPedidoIdx = picoIdx >= 0 ? (picoIdx + 10) % 12 : -1; // ~2 meses antes do pico

  const picoDe = (p: ProdutoAgregado) => {
    const max = Math.max(...p.meses);
    return max > 0 ? p.meses.indexOf(max) : -1;
  };
  const escassezDe = (p: ProdutoAgregado) => {
    const comDados = p.meses.map((v, i) => ({ v, i })).filter(m => m.v > 0);
    if (comDados.length < 2) return -1;
    return comDados.reduce((a, b) => (b.v < a.v ? b : a)).i;
  };

  return (
    <MainLayout
      title="Produtos & Sazonalidade"
      description="Os produtos mais comprados pelos teus clientes, o pico de procura e a época de escassez — para pedires crédito no momento certo."
    >
      <div className="space-y-6">
        {!temDados && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <PackageSearch className="w-10 h-10 text-muted-foreground" />
              <p className="font-semibold">
                {isLoading ? 'A carregar...' : 'Ainda não há dados de produtos.'}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                Envia um ficheiro SAF-T (AO) na página “Enviar SAF-T”. Lemos as linhas dos teus documentos
                e construímos aqui o ranking de produtos e a curva de sazonalidade.
              </p>
            </CardContent>
          </Card>
        )}

        {temDados && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Pico de compra
                  </div>
                  <p className="text-2xl font-black mt-2">{MESES[picoIdx]}</p>
                  <p className="text-xs text-muted-foreground mt-1">Mês com maior volume vendido.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingDown className="w-4 h-4 text-destructive" /> Escassez / baixa procura
                  </div>
                  <p className="text-2xl font-black mt-2">{escassezIdx >= 0 ? MESES[escassezIdx] : '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Mês mais fraco — cuidado com a tesouraria.</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="w-4 h-4 text-primary" /> Melhor época para pedir crédito
                  </div>
                  <p className="text-2xl font-black mt-2 text-primary">
                    {melhorPedidoIdx >= 0 ? MESES[melhorPedidoIdx] : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cerca de 2 meses antes do pico, para teres stock a tempo.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" /> Curva anual de procura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1.5 h-40">
                  {globalMeses.map((v, i) => {
                    const max = Math.max(...globalMeses) || 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            i === picoIdx ? 'bg-primary' : i === escassezIdx ? 'bg-destructive/50' : 'bg-primary/25'
                          }`}
                          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                          title={`${MESES[i]}: ${v.toLocaleString('pt-AO')} un.`}
                        />
                        <span className="text-[10px] text-muted-foreground">{MESES[i].slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
                  <Info className="w-3.5 h-3.5" />
                  Calculado a partir das linhas dos documentos dos teus ficheiros SAF-T validados.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="text-base">Produtos mais comprados</CardTitle>
                <Input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Procurar produto..."
                  className="max-w-[220px] h-9"
                />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="text-left font-medium px-4 py-2">#</th>
                        <th className="text-left font-medium px-4 py-2">Produto</th>
                        <th className="text-right font-medium px-4 py-2">Qtd.</th>
                        <th className="text-right font-medium px-4 py-2">Facturado</th>
                        <th className="text-left font-medium px-4 py-2">Pico</th>
                        <th className="text-left font-medium px-4 py-2">Escassez</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtrados.slice(0, 50).map((p, idx) => {
                        const pi = picoDe(p);
                        const ei = escassezDe(p);
                        return (
                          <tr key={p.codigo + idx} className="hover:bg-muted/40">
                            <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{p.descricao}</p>
                              <p className="text-xs text-muted-foreground">{p.codigo}</p>
                            </td>
                            <td className="px-4 py-3 text-right">{p.quantidade.toLocaleString('pt-AO')}</td>
                            <td className="px-4 py-3 text-right font-semibold">{kz(p.total)}</td>
                            <td className="px-4 py-3">
                              {pi >= 0
                                ? <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">{MESES[pi]}</Badge>
                                : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {ei >= 0
                                ? <Badge variant="secondary" className="bg-destructive/10 text-destructive">{MESES[ei]}</Badge>
                                : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filtrados.length === 0 && (
                  <p className="text-sm text-muted-foreground p-6 text-center">Nenhum produto encontrado.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
