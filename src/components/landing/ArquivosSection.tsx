import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, FileWarning, Scale, Search, Package, Monitor,
  Lock, ClipboardList, ShieldCheck, Activity, Phone, Clock,
  FileCheck, Zap, MessageSquare, Sparkles, ArrowRight, Check,
} from 'lucide-react';

/* ── Local in-view hook ── */
function useInView(threshold = 0.15): [React.RefObject<any>, boolean] {
  const ref = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, v] = useInView(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .5s ease-out ${delay}ms, transform .5s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── ARQUIVOS SECTION — deep navy + gold accents, lucide icons only ── */
export default function ArquivosSection() {
  return (
    <div id="arquivos" className="arquivos-root">
      <style>{`
        .arquivos-root { --arq-navy:#0D1117; --arq-navy-2:#1C2333; --arq-gold:#F5A623; }
        .arq-dark { background: var(--arq-navy); color: #fff; }
        .arq-light { background: #F7F8FA; color: #0D1117; }

        .arq-card {
          background: var(--arq-navy-2);
          border-left: 3px solid var(--arq-gold);
          border-radius: 10px;
          padding: 22px 22px;
          color: #fff;
          box-shadow: 0 8px 24px rgba(0,0,0,.25);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .arq-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(245,166,35,.25); }

        .arq-icon-chip {
          width: 44px; height: 44px; border-radius: 10px;
          background: rgba(245,166,35,.14);
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--arq-gold);
        }

        @keyframes arq-underline { from { width: 0 } to { width: 100% } }
        .arq-underline-anim { position: relative; display: inline-block; color: var(--arq-gold); font-style: italic; font-weight: 700; }
        .arq-underline-anim::after {
          content:''; position:absolute; left:0; bottom:-6px; height:2px; width:0;
          background: var(--arq-gold);
          animation: arq-underline .9s ease-out .4s forwards;
        }

        @keyframes arq-countdown { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 691; } }
        .arq-ring { animation: arq-countdown 4s linear infinite; transform-origin: center; }

        @keyframes arq-badge-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,.35); }
          50%     { box-shadow: 0 0 24px 6px rgba(245,166,35,.35); }
        }
        .arq-badge-pulse { animation: arq-badge-glow 2.4s ease-in-out infinite; }

        @keyframes arq-shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
        .arq-cta-primary { position: relative; overflow: hidden; }
        .arq-cta-primary::after {
          content:''; position:absolute; top:0; left:0; width:40%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
          transform: translateX(-120%);
          animation: arq-shimmer 3s ease-in-out infinite;
        }

        @keyframes arq-typing { from { width: 0 } to { width: 100% } }
        .arq-typing {
          display: inline-block; overflow: hidden; white-space: nowrap;
          border-right: 2px solid var(--arq-gold);
          animation: arq-typing 2.4s steps(40, end) forwards;
        }
        @keyframes arq-dot { 0%,80%,100% { opacity:.2 } 40% { opacity:1 } }
        .arq-dot { display:inline-block; width:6px; height:6px; margin:0 2px; background:var(--arq-gold); border-radius:50%; animation: arq-dot 1.2s infinite; }
        .arq-dot:nth-child(2) { animation-delay: .2s }
        .arq-dot:nth-child(3) { animation-delay: .4s }

        .arq-flip { transition: transform .5s ease, box-shadow .3s ease; }
        .arq-flip:hover { transform: scale(1.03); box-shadow: 0 16px 36px rgba(0,0,0,.15); }

        @media (prefers-reduced-motion: reduce) {
          .arq-ring, .arq-badge-pulse, .arq-cta-primary::after, .arq-typing, .arq-underline-anim::after, .arq-dot { animation: none !important; }
        }
      `}</style>

      {/* Visual separator */}
      <div className="w-full py-10 flex items-center justify-center gap-4 bg-background">
        <div className="h-px w-24 bg-border" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Outro produto do grupo</span>
        <div className="h-px w-24 bg-border" />
      </div>

      {/* ─── SECTION 1 · The Problem ─── */}
      <section className="arq-dark py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-12 max-w-4xl">
              Quanto tempo leva a encontrar um documento agora mesmo?
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {[
              { Icon: AlertTriangle, t: 'Auditorias AGT sem resposta a tempo' },
              { Icon: FileWarning, t: 'Contratos que não se provam por falta de original' },
              { Icon: Scale, t: 'Processos legais prolongados por desorganização' },
              { Icon: Search, t: 'Decisões atrasadas por falta de informação' },
            ].map(({ Icon, t }, i) => (
              <Reveal key={i} delay={i * 200}>
                <div className="arq-card h-full">
                  <div className="arq-icon-chip mb-4"><Icon className="w-5 h-5" /></div>
                  <p className="text-sm leading-relaxed text-white/90">{t}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={900}>
            <p className="text-lg md:text-2xl leading-snug max-w-4xl">
              <span className="arq-underline-anim">
                Um arquivo desorganizado não é um problema administrativo. É um risco operacional, legal e financeiro.
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── SECTION 2 · 60 second guarantee ─── */}
      <section className="arq-light py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <div className="relative w-60 h-60 mx-auto mb-8">
              <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90">
                <circle cx="120" cy="120" r="110" stroke="rgba(13,17,23,.08)" strokeWidth="8" fill="none" />
                <circle
                  className="arq-ring"
                  cx="120" cy="120" r="110"
                  stroke="#F5A623" strokeWidth="8" fill="none"
                  strokeDasharray="691" strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black" style={{ fontSize: 132, color: '#F5A623', lineHeight: 1 }}>60</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Qualquer documento. Em 60 segundos. Sempre.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Ou pagamos a penalização. Contratualmente.
            </p>
            <div className="inline-flex items-center gap-2 arq-badge-pulse rounded-full px-6 py-3 font-bold text-sm"
                 style={{ background: '#F5A623', color: '#0D1117' }}>
              <ShieldCheck className="w-4 h-4" />
              Penalização contratual até AOA 50.000.000 por violação
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SECTION 3 · How it works ─── */}
      <section className="arq-dark py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white text-center mb-16">Como funciona</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { Icon: Search, t: 'Avaliação Gratuita', d: 'Diagnóstico completo do arquivo actual sem custo nem compromisso. Visita de 30 minutos nas vossas instalações.', b: '30 minutos • Sem compromisso' },
              { Icon: Package, t: 'Organização e Digitalização', d: 'Estrutura física e digital aprovada pelo cliente. Cada documento recebe um código único físico e digital.', b: 'Código único por documento' },
              { Icon: Monitor, t: 'Gestão Contínua', d: 'Equipa residente nas vossas instalações, plataforma digital de rastreio, relatórios periódicos entregues à Direcção.', b: 'Equipa residente • Relatórios à Direcção' },
            ].map(({ Icon, t, d, b }, i) => (
              <Reveal key={i} delay={i * 200}>
                <div className="relative text-center">
                  <div className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center"
                       style={{ background: '#F5A623', color: '#0D1117' }}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-white">{t}</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-4 max-w-xs mx-auto">{d}</p>
                  <span className="inline-block text-xs font-semibold rounded-full px-3 py-1"
                        style={{ background: 'rgba(245,166,35,.15)', color: '#F5A623' }}>
                    {b}
                  </span>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 -right-4" style={{ color: '#F5A623' }}>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 · Service levels ─── */}
      <section className="arq-light py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center mb-14">Níveis de Serviço</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {[
              { border: '#6B7280', title: 'N1 — Standard', sub: 'PMEs e empresas privadas',
                features: ['NDA básico', 'Plataforma digital', 'Relatório mensal'], scale: 1, recommended: false },
              { border: '#3B82F6', title: 'N2 — Elevado', sub: 'Instituições estatais e Governo',
                features: ['NDA reforçado', 'Protocolo de segurança adaptado', 'Relatório semanal'], scale: 1.02, recommended: false },
              { border: '#F5A623', title: 'N3 — Máximo', sub: 'Petrolíferas • Bancos • Seguradoras',
                features: ['NDA específico N3', 'Penalização AOA 50.000.000', 'Relatório diário', 'Resposta a incidentes em 2h', 'Arquivo AI incluído'], scale: 1.04, recommended: true },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 150}>
                <div
                  className="arq-flip relative h-full bg-white rounded-xl p-7"
                  style={{
                    borderTop: `4px solid ${c.border}`,
                    transform: `scale(${c.scale})`,
                    boxShadow: c.recommended ? '0 0 32px rgba(245,166,35,.30)' : '0 4px 16px rgba(0,0,0,.06)',
                  }}
                >
                  {c.recommended && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-black tracking-wider rounded-full px-2 py-1"
                          style={{ background: '#F5A623', color: '#0D1117' }}>
                      <Sparkles className="w-3 h-3" /> RECOMENDADO
                    </span>
                  )}
                  <h3 className="text-xl font-black mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{c.sub}</p>
                  <ul className="space-y-2.5">
                    {c.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F5A623' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 · Arquivo AI teaser ─── */}
      <section className="arq-dark py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="rounded-2xl p-6" style={{ background: '#1C2333', border: '1px solid rgba(245,166,35,.2)' }}>
              <div className="space-y-4 text-sm">
                <div className="rounded-lg p-3 max-w-[85%] flex items-start gap-2" style={{ background: 'rgba(255,255,255,.06)' }}>
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/60" />
                  <span className="arq-typing block text-white/90">Quais os contratos do Bloco 15 de 2024?</span>
                </div>
                <div className="rounded-lg p-3 max-w-[60%] ml-auto flex items-center gap-1"
                     style={{ background: 'rgba(245,166,35,.12)' }}>
                  <span className="arq-dot" /><span className="arq-dot" /><span className="arq-dot" />
                </div>
                <div className="rounded-lg p-3 max-w-[90%] ml-auto text-white/90 flex items-start gap-2" style={{ background: 'rgba(245,166,35,.12)' }}>
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F5A623' }} />
                  <span>Encontrei 3 documentos relacionados. Contrato PSA-2024-B15 localizado em Sala 2 • Estante 4 • Prateleira 3...</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest mb-3 px-3 py-1 rounded-full"
                  style={{ background: 'rgba(245,166,35,.15)', color: '#F5A623' }}>
              <Sparkles className="w-3 h-3" /> EM BREVE
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Arquivo AI</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Converse com os documentos da sua organização em linguagem natural. Encontre qualquer informação em segundos.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Pesquisa em linguagem natural', 'Localização física automática', 'Rastreio de acessos'].map(t => (
                <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{ borderColor: '#F5A623', color: '#F5A623' }}>
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SECTION 6 · Guarantees ─── */}
      <section className="arq-light py-24">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center mb-14">As nossas garantias</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
            {[
              { Icon: Lock, t: 'NDA assinado no mesmo dia do contrato' },
              { Icon: Activity, t: 'Registo automático de cada acesso a documentos' },
              { Icon: ClipboardList, t: 'Relatório de auditoria periódico entregue à Direcção' },
              { Icon: Monitor, t: 'Plataforma digital com rastreabilidade total' },
              { Icon: Zap, t: 'Protocolo de resposta a incidentes em menos de 2 horas' },
              { Icon: ShieldCheck, t: 'Penalizações contratuais por violação — AOA 5.000.000 a 50.000.000' },
            ].map(({ Icon, t }, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex items-start gap-3 py-4 border-b border-black/5">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#F5A623' }} />
                  <span className="text-sm md:text-base">{t}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7 · CTA final ─── */}
      <section className="arq-dark py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, rgba(245,166,35,.10), transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Agende a avaliação gratuita do seu arquivo</h2>
            <p className="text-white/70 mb-10 text-lg">
              30 minutos. Sem custo. Sem compromisso. Com diagnóstico completo no final.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                className="arq-cta-primary h-14 px-8 font-black text-base rounded-lg gap-2"
                style={{ background: '#F5A623', color: '#0D1117' }}
                onClick={() => window.location.href = 'tel:+244922717574'}
              >
                <FileCheck className="w-5 h-5" />
                Agendar Avaliação Gratuita
              </Button>
              <Button
                variant="outline"
                className="h-14 px-8 font-bold text-base rounded-lg bg-transparent gap-2"
                style={{ borderColor: '#F5A623', color: '#F5A623' }}
                onClick={() => window.location.href = 'tel:+244922717574'}
              >
                <Phone className="w-5 h-5" />
                +244 922 717 574
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-white/60">
              <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" style={{ color: '#F5A623' }} /> Confidencialidade garantida</span>
              <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: '#F5A623' }} /> Diagnóstico escrito em 48h</span>
              <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: '#F5A623' }} /> Resposta em 60 segundos</span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
