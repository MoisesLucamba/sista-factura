import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { calcularScore, classeLabel } from '@/lib/credit-score';
import type { SaftMonth } from '@/lib/saft-parse';
import { formatCurrency } from '@/lib/format';
import { Gauge, Banknote, TrendingUp, CalendarClock } from 'lucide-react';
import { readGuest, writeGuest } from '@/lib/guest';

export interface SimInputs {
  faturacaoMensal: number;
  melhorMes: number;
  piorMes: number;
  mesesActividade: number;
  crescimento: number;   // % ano
  conformidade: boolean;
}

const DEFAULTS: SimInputs = {
  faturacaoMensal: 4_000_000,
  melhorMes: 6_500_000,
  piorMes: 2_000_000,
  mesesActividade: 12,
  crescimento: 15,
  conformidade: true,
};

/** Constrói 12 meses sintéticos a partir dos inputs do utilizador. */
function construirMeses(i: SimInputs): SaftMonth[] {
  const n = Math.max(3, Math.min(24, Math.round(i.mesesActividade)));
  const amplitude = Math.max(0, (i.melhorMes - i.piorMes) / 2);
  const base = i.faturacaoMensal;
  const growthPerMonth = i.crescimento / 100 / 12;
  const meses: SaftMonth[] = [];
  const hoje = new Date();
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - k, 1);
    const idx = n - 1 - k;
    const sazonal = Math.sin((idx / 12) * Math.PI * 2) * amplitude;
    const total = Math.max(0, (base + sazonal) * (1 + growthPerMonth * idx));
    meses.push({
      mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      total: Math.round(total),
      documentos: Math.max(1, Math.round(total / 25_000)),
    });
  }
  return meses;
}

interface Props {
  /** Guarda os valores no modo visitante (localStorage, 2h). */
  persistGuest?: boolean;
}

export function SimuladorCredito({ persistGuest = false }: Props) {
  const [inputs, setInputs] = useState<SimInputs>(() => {
    if (persistGuest) {
      const saved = readGuest<{ sim?: SimInputs }>();
      if (saved?.sim) return { ...DEFAULTS, ...saved.sim };
    }
    return DEFAULTS;
  });

  useEffect(() => {
    if (persistGuest) writeGuest({ sim: inputs });
  }, [inputs, persistGuest]);

  const set = <K extends keyof SimInputs>(k: K, v: SimInputs[K]) =>
    setInputs(prev => ({ ...prev, [k]: v }));

  const num = (k: keyof SimInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Number(e.target.value.replace(/\D/g, '')) as never);

  const resultado = useMemo(() => {
    const meses = construirMeses(inputs);
    return calcularScore(meses, {
      conformidadeOk: inputs.conformidade,
      mesesHistorico: inputs.mesesActividade,
    });
  }, [inputs]);

  const prestacao = resultado.limiteRecomendado > 0
    ? (resultado.limiteRecomendado / resultado.prazoMeses) *
      (1 + resultado.taxaMensal / 100)
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Os teus números
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Faturação média mensal (AOA)</Label>
            <Input inputMode="numeric" value={inputs.faturacaoMensal}
                   onChange={num('faturacaoMensal')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Melhor mês (AOA)</Label>
              <Input inputMode="numeric" value={inputs.melhorMes} onChange={num('melhorMes')} />
            </div>
            <div className="space-y-2">
              <Label>Pior mês (AOA)</Label>
              <Input inputMode="numeric" value={inputs.piorMes} onChange={num('piorMes')} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Meses de actividade com faturação</Label>
              <span className="text-sm font-bold text-primary">{inputs.mesesActividade}</span>
            </div>
            <Slider min={3} max={24} step={1} value={[inputs.mesesActividade]}
                    onValueChange={([v]) => set('mesesActividade', v)} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Crescimento anual estimado</Label>
              <span className="text-sm font-bold text-primary">{inputs.crescimento}%</span>
            </div>
            <Slider min={-30} max={100} step={5} value={[inputs.crescimento]}
                    onValueChange={([v]) => set('crescimento', v)} />
          </div>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={inputs.conformidade}
                   onChange={e => set('conformidade', e.target.checked)}
                   className="h-4 w-4 accent-primary" />
            Emito com software certificado pela AGT (SAF-T disponível)
          </label>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" /> Score estimado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black tracking-tight">{resultado.score}</span>
              <span className="text-muted-foreground mb-2">/ 1000</span>
              <Badge className="mb-2 ml-auto">Classe {resultado.classe}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{classeLabel[resultado.classe]}</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all"
                   style={{ width: `${Math.min(100, resultado.score / 10)}%` }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              {[
                { l: 'Limite recomendado', v: formatCurrency(resultado.limiteRecomendado), icon: Banknote },
                { l: 'Prazo sugerido', v: `${resultado.prazoMeses} meses`, icon: CalendarClock },
                { l: 'Taxa de referência', v: `${resultado.taxaMensal}% / mês`, icon: TrendingUp },
                { l: 'Prestação estimada', v: formatCurrency(Math.round(prestacao)), icon: Banknote },
              ].map(c => (
                <div key={c.l} className="rounded-xl border border-border bg-card p-4">
                  <c.icon className="w-4 h-4 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{c.l}</p>
                  <p className="text-base font-bold">{c.v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como chegámos ao score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { l: 'Volume de faturação', v: resultado.breakdown.volume, max: 30 },
              { l: 'Consistência mensal', v: resultado.breakdown.consistencia, max: 25 },
              { l: 'Crescimento', v: resultado.breakdown.crescimento, max: 20 },
              { l: 'Histórico disponível', v: resultado.breakdown.historico, max: 15 },
              { l: 'Conformidade fiscal', v: resultado.breakdown.conformidade, max: 10 },
            ].map(b => (
              <div key={b.l} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.l}</span>
                  <span className="font-semibold">{b.v} / {b.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full"
                       style={{ width: `${(b.v / b.max) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Simulação indicativa. O score final é calculado a partir dos dados reais do teu
              ficheiro SAF-T (AO) validado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
