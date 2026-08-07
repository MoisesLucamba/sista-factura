import type { SaftMonth } from './saft-parse';

export interface ScoreBreakdown {
  volume: number;        // 0-30
  consistencia: number;  // 0-25
  crescimento: number;   // 0-20
  historico: number;     // 0-15
  conformidade: number;  // 0-10
}

export interface ScoreResult {
  score: number;               // 0-1000
  classe: 'A' | 'B' | 'C' | 'D';
  breakdown: ScoreBreakdown;
  mediaMensal: number;
  volatilidade: number;        // 0-1 (coef. de variação normalizado)
  crescimentoPct: number;      // variação 1º vs último trimestre disponível
  mesesAnalisados: number;
  limiteRecomendado: number;   // AOA
  prazoMeses: number;
  taxaMensal: number;          // %
  sazonalidade: { mes: string; indice: number }[]; // índice 1 = média
}

const CLASSES: Record<ScoreResult['classe'], { min: number; taxa: number; prazo: number; mult: number }> = {
  A: { min: 800, taxa: 1.6, prazo: 12, mult: 1.5 },
  B: { min: 650, taxa: 2.2, prazo: 9,  mult: 1.0 },
  C: { min: 480, taxa: 3.0, prazo: 6,  mult: 0.6 },
  D: { min: 0,   taxa: 4.0, prazo: 3,  mult: 0.25 },
};

const round = (n: number, d = 0) => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

export function calcularScore(
  meses: SaftMonth[],
  opts?: { conformidadeOk?: boolean; mesesHistorico?: number },
): ScoreResult {
  const dados = [...meses].sort((a, b) => a.mes.localeCompare(b.mes));
  const valores = dados.map(m => m.total);
  const n = valores.length;

  const media = n ? valores.reduce((a, b) => a + b, 0) / n : 0;
  const desvio = n > 1
    ? Math.sqrt(valores.reduce((a, v) => a + Math.pow(v - media, 2), 0) / (n - 1))
    : 0;
  const cv = media > 0 ? desvio / media : 1;
  const volatilidade = Math.min(1, cv);

  // Volume (0-30): escala logarítmica até 50M AOA/mês
  const volume = media <= 0 ? 0 : Math.min(30, (Math.log10(media) / Math.log10(50_000_000)) * 30);

  // Consistência (0-25): menor volatilidade = melhor
  const consistencia = Math.max(0, 25 * (1 - volatilidade));

  // Crescimento (0-20): compara primeira metade com segunda metade
  let crescimentoPct = 0;
  if (n >= 4) {
    const meio = Math.floor(n / 2);
    const a = valores.slice(0, meio).reduce((x, y) => x + y, 0) / meio;
    const b = valores.slice(meio).reduce((x, y) => x + y, 0) / (n - meio);
    crescimentoPct = a > 0 ? ((b - a) / a) * 100 : 0;
  }
  const crescimento = Math.max(0, Math.min(20, 10 + crescimentoPct / 5));

  // Histórico (0-15): 12 meses = máximo
  const mesesHistorico = opts?.mesesHistorico ?? n;
  const historico = Math.min(15, (mesesHistorico / 12) * 15);

  // Conformidade fiscal (0-10)
  const conformidade = opts?.conformidadeOk === false ? 0 : 10;

  const breakdown: ScoreBreakdown = {
    volume: round(volume, 1),
    consistencia: round(consistencia, 1),
    crescimento: round(crescimento, 1),
    historico: round(historico, 1),
    conformidade,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0); // 0-100
  const score = Math.round(total * 10);

  const classe = (Object.keys(CLASSES) as ScoreResult['classe'][])
    .find(c => score >= CLASSES[c].min) ?? 'D';
  const cfg = CLASSES[classe];

  // Limite: múltiplo da facturação média mensal, ajustado pela volatilidade
  const limiteRecomendado = Math.round((media * cfg.mult * (1 - volatilidade * 0.4)) / 1000) * 1000;

  const sazonalidade = dados.map(m => ({
    mes: m.mes,
    indice: media > 0 ? round(m.total / media, 2) : 0,
  }));

  return {
    score,
    classe,
    breakdown,
    mediaMensal: round(media, 2),
    volatilidade: round(volatilidade, 2),
    crescimentoPct: round(crescimentoPct, 1),
    mesesAnalisados: n,
    limiteRecomendado: Math.max(0, limiteRecomendado),
    prazoMeses: cfg.prazo,
    taxaMensal: cfg.taxa,
    sazonalidade,
  };
}

export const classeLabel: Record<ScoreResult['classe'], string> = {
  A: 'Risco muito baixo',
  B: 'Risco baixo',
  C: 'Risco moderado',
  D: 'Risco elevado',
};
