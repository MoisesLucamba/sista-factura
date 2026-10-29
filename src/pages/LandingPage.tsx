import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { track } from '@/lib/track';
import logoGiro from '@/assets/giro-logo-light.svg';
import logoGiroTagline from '@/assets/giro-logo-tagline-light.svg';
import heroBusiness from '@/assets/hero-business.jpg';
import { PERFIS } from '@/lib/perfis';
import {
  ShieldCheck, Lock, FileText, Calculator, Mail, MapPin, CheckCircle2, LogIn,
  Landmark, Scale, ClipboardCheck,
} from 'lucide-react';

/* Aparece suavemente quando entra no ecrã */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{children}</span>
);

const passos = [
  {
    titulo: 'Envia o teu SAF-T',
    texto: 'O ficheiro que o teu software de faturação já gera todos os meses. Sem integrações, sem mudar de sistema.',
  },
  {
    titulo: 'Recebe o teu score',
    texto: 'Analisamos volume, consistência, crescimento e conformidade fiscal para gerar um score de 0 a 1000.',
  },
  {
    titulo: 'Pede capital de giro',
    texto: 'Enviamos o teu dossier já validado aos bancos parceiros. Menos papelada, decisão mais rápida.',
  },
];

const provas = [
  { icon: ShieldCheck, titulo: 'Validação AGT', texto: 'Estrutura SAF-T (AO), certificado do software, assinaturas digitais e correspondência de NIF.' },
  { icon: Lock, titulo: 'Os dados são teus', texto: 'O ficheiro é lido no teu dispositivo. Só partilhamos o dossier quando pedes crédito.' },
  { icon: FileText, titulo: 'Pronto para banco', texto: 'Histórico, sazonalidade e conformidade fiscal num único documento aceite pelos analistas.' },
];

/* Dados públicos: cada número tem fonte no rodapé da secção */
const numeros = [
  { valor: '92%', texto: 'das PME em Angola não têm acesso a financiamento (estimativa do IFC)' },
  { valor: '34 mil M USD', texto: 'de défice de financiamento às PME, segundo o IFC' },
  { valor: 'até 90%', texto: 'do crédito às MPME pode ser coberto pela garantia pública do FGC' },
  { valor: '2,5%', texto: 'do activo líquido dos bancos tem de ir para o sector real (Aviso 10 do BNA)' },
];

const emMarcha = [
  {
    icon: Landmark,
    titulo: 'IFC',
    texto: 'Concedeu 50 milhões de USD ao Banco Millennium Atlântico para crédito às PME, mais 50 milhões para comércio internacional.',
  },
  {
    icon: ShieldCheck,
    titulo: 'FGC',
    texto: 'O Fundo de Garantia de Crédito apoiou 216 projectos em 2023, cerca de 106 mil milhões de Kz. A linha Diversifica Mais soma 80 milhões de USD.',
  },
  {
    icon: Scale,
    titulo: 'Aviso 10 do BNA',
    texto: 'Até Maio de 2026: 1.110 operações, 2,23 biliões de Kz contratados e 1,40 bilião já desembolsado.',
  },
];

/* Lista de referência com base nas listas públicas de BFA, Banco Económico e BAI */
const documentos = [
  {
    grupo: 'A empresa',
    itens: [
      'Certidão de registo comercial actualizada',
      'Alvará da actividade económica',
      'NIF e documento de identificação dos sócios e gestores',
      'Acta que nomeia os gestores e autoriza o pedido de crédito',
      'Declaração do beneficiário efectivo final (BEF)',
    ],
  },
  {
    grupo: 'Situação fiscal',
    itens: [
      'Certidão de não devedor da AGT',
      'Certidão de não devedor da Segurança Social',
      'Modelo 1 do Imposto Industrial do último exercício',
      'Comprovativo do IRT do mês anterior e número de trabalhadores',
    ],
  },
  {
    grupo: 'Finanças',
    itens: [
      'Balanço, demonstração de resultados e fluxos de caixa',
      'Balancete analítico do último mês',
      'Relatório e contas dos últimos 3 exercícios, com contas certificadas por contabilista',
      'Mapa de facturação dos últimos 3 anos',
    ],
  },
  {
    grupo: 'O pedido',
    itens: [
      'Carta de pedido: montante, finalidade, prazo e garantias',
      'Plano de negócios, se for crédito ao investimento',
      'Facturas pró-forma ou orçamentos do que vais comprar',
      'Certificação de MPME do INAPEM',
    ],
  },
];

const giroResolve = [
  'Histórico de facturação e volume, a partir do SAF-T',
  'Conformidade fiscal, validada segundo a AGT',
  'Sazonalidade, para pedires no momento certo',
  'Score e dossier prontos para o analista do banco',
];

const baseLegal = [
  {
    ref: 'Decreto Presidencial n.º 71/25',
    titulo: 'Regime Jurídico das Facturas',
    texto: 'Define o SAF-T (AO) e a facturação electrónica validada pela AGT. O ficheiro de contabilidade entrega-se até 10 de Abril de cada ano.',
  },
  {
    ref: 'Decreto Presidencial n.º 78/12',
    titulo: 'Fundo de Garantia de Crédito',
    texto: 'Cria o FGC, que dá garantias públicas ao crédito bancário das micro, pequenas e médias empresas.',
  },
  {
    ref: 'Lei n.º 30/11',
    titulo: 'Lei das MPME',
    texto: 'Classifica as micro, pequenas e médias empresas. O acesso aos apoios exige as obrigações fiscais regularizadas.',
  },
  {
    ref: 'Aviso n.º 10/2022 do BNA',
    titulo: 'Crédito ao sector real',
    texto: 'Obriga os bancos a canalizar pelo menos 2,5% do activo líquido para o sector real, com juros até 7,5% no investimento e 10% em matéria-prima, insumos e factoring. Pede contabilidade organizada, contas certificadas e situação fiscal regular.',
  },
  {
    ref: 'Lei n.º 14/21',
    titulo: 'Regime Geral das Instituições Financeiras',
    texto: 'Reserva a concessão de crédito às instituições autorizadas pelo BNA. Por isso o Giro não concede crédito: apresenta o teu dossier a bancos parceiros.',
  },
  {
    ref: 'Lei n.º 22/11',
    titulo: 'Protecção de Dados Pessoais',
    texto: 'Regula o tratamento de dados pessoais. O Giro só trata os teus dados com o teu consentimento.',
  },
];

const meses = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const procura = [22, 30, 48, 92, 74, 60, 52, 58, 66, 55, 44, 30];
const picoIdx = 3;

export default function LandingPage() {
  const click = (label: string) => track({ event: 'click', section: 'landing', label });

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoGiro} alt="Giro" className="h-9 md:h-10 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#dados" className="hover:text-foreground transition-colors">Dados públicos</a>
            <a href="#documentos" className="hover:text-foreground transition-colors">Documentos</a>
            <a href="#confianca" className="hover:text-foreground transition-colors">Confiança</a>
            <a href="#base-legal" className="hover:text-foreground transition-colors">Base legal</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login" title="Entrar" aria-label="Entrar" onClick={() => click('nav_login')}>
                <LogIn className="h-4 w-4 sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/simulador" onClick={() => click('nav_simulador')}>Simular crédito</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal>
            <img
              src={logoGiroTagline}
              alt="Giro — O teu dinheiro em movimento"
              className="mb-8 w-full max-w-[460px] h-auto"
              loading="eager"
            />
            <Eyebrow>Crédito para empresas · Luanda</Eyebrow>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Capital de giro,{' '}
              <span className="text-primary">baseado no que já vendes.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base md:text-lg leading-relaxed text-muted-foreground">
              Transformamos o teu histórico de faturação num dossier de crédito em que os bancos
              confiam. Envia o SAF-T, recebe o teu score e pede capital sem papelada.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
                <Link to="/simulador" onClick={() => click('hero_simulador')}>
                  <Calculator className="w-4 h-4 mr-2" /> Simular crédito
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-base">
                <a href="#lancamento" onClick={() => click('hero_avisem_me')}>Avisem-me no lançamento</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground/70">
              Sem cartão · Sem mudar de software de faturação
            </p>
          </Reveal>

          <Reveal delay={150}>
            <img
              src={heroBusiness}
              alt="Empresários angolanos a analisar o desempenho da empresa"
              className="w-full h-[320px] md:h-[480px] object-cover rounded-2xl shadow-xl"
              loading="eager"
            />
          </Reveal>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <Eyebrow>Como funciona</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Três passos. <span className="text-primary">Zero burocracia.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-10 md:gap-8">
            {passos.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 120}>
                <span className="font-display text-5xl font-bold text-primary/30 tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl font-bold tracking-tight">{p.titulo}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{p.texto}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DADOS PÚBLICOS */}
      <section id="dados" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <Eyebrow>Dados públicos</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Há capital e garantias para as PME. <span className="text-primary">Falta prova.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Bancos, IFC e FGC já estão a abrir espaço ao crédito às PME. O que muitas empresas não
              têm é um histórico que o banco consiga validar. É isso que o Giro prepara.
            </p>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {numeros.map((n, i) => (
              <Reveal key={n.valor} delay={i * 100}>
                <div className="h-full rounded-2xl border border-border p-6">
                  <p className="font-display text-3xl md:text-4xl font-bold text-primary tabular-nums">{n.valor}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{n.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-5 grid md:grid-cols-3 gap-5">
            {emMarcha.map((m, i) => (
              <Reveal key={m.titulo} delay={i * 100}>
                <div className="h-full rounded-2xl bg-muted/40 p-7">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <m.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="mt-5 font-display font-bold">{m.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground/70 leading-relaxed">
            Fontes: IFC, via comunicado do Banco Millennium Atlântico; Expansão (FGC, Março de 2024; Aviso 10);
            BeCorporate (linha Diversifica Mais); Angonotícias / Jornal de Angola (Aviso 10/2024, Maio de 2026).
            A cobertura do FGC varia consoante o banco, o montante e a linha.
          </p>
        </div>
      </section>

      {/* DOCUMENTOS */}
      <section id="documentos" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <Eyebrow>Documentos</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Além do SAF-T, <span className="text-primary">o que os bancos pedem.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              O SAF-T prova o que vendes e a tua conformidade fiscal. O banco ainda precisa de
              alguns documentos da empresa. Prepara-os com antecedência e o pedido anda mais depressa.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 gap-5">
            {documentos.map((g, i) => (
              <Reveal key={g.grupo} delay={i * 100}>
                <div className="h-full rounded-2xl bg-background border border-border p-7">
                  <h3 className="font-display font-bold flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                    {g.grupo}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                    {g.itens.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-7 md:p-8">
              <h3 className="font-display font-bold">O que o Giro já resolve a partir do teu SAF-T</h3>
              <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-muted-foreground leading-relaxed">
                {giroResolve.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <p className="mt-6 text-xs text-muted-foreground/70 leading-relaxed">
            Lista de referência, com base nas listas públicas de documentos do BFA, do Banco Económico e do BAI.
            Cada banco define a sua lista e pode pedir outros documentos, por exemplo licenças e garantias no
            crédito ao investimento. Ao pedir a garantia do FGC, o banco envia a checklist própria do Fundo.
            Confirma sempre com o teu banco. A decisão e o desembolso são sempre do banco.
          </p>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section id="confianca" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <Eyebrow>Confiança</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Credibilidade que vem da <span className="text-primary">conformidade fiscal.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Cada ficheiro passa por uma validação automática. Só dados validados entram no cálculo
              do score, e é isso que dá peso ao teu dossier junto dos bancos.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {provas.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 120}>
                <div className="h-full rounded-2xl border border-border p-7 transition-shadow hover:shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="mt-5 font-display font-bold">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BASE LEGAL */}
      <section id="base-legal" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <Eyebrow>Base legal</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              As regras que dão <span className="text-primary">peso ao teu dossier.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Estes são os diplomas por trás do SAF-T, do crédito às PME e das garantias públicas.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {baseLegal.map((b, i) => (
              <Reveal key={b.ref} delay={i * 100}>
                <div className="h-full rounded-2xl bg-background border border-border p-7">
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">{b.ref}</span>
                  <h3 className="mt-3 font-display font-bold">{b.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground/70 leading-relaxed">
            Resumo informativo, sem valor de aconselhamento jurídico. Consulta o texto oficial de cada diploma.
          </p>
        </div>
      </section>

      {/* SAZONALIDADE */}
      <section id="sazonalidade" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal>
            <Eyebrow>Sazonalidade</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Conhece o teu pico <span className="text-primary">antes de pedir crédito.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-md">
              Mostramos os produtos mais comprados, o mês de pico e o mês de escassez, para pedires
              capital de giro quando ele rende mais.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl bg-background border border-border p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Procura · ano típico</span>
                <span className="font-medium text-primary">Pico em Abril</span>
              </div>
              <div className="mt-6 flex items-end gap-2 h-44">
                {procura.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <div
                      className={`w-full rounded-t-md transition-colors ${i === picoIdx ? 'bg-primary' : 'bg-primary/25'}`}
                      style={{ height: `${v}%` }}
                    />
                    <span className={`text-[10px] ${i === picoIdx ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}>
                      {meses[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PERFIS */}
      <section id="perfis" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>Quatro perfis</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Seja quem fores, tens lugar no Giro.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              No lançamento, cada perfil terá o seu próprio espaço, só com os dados de que precisa.
            </p>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERFIS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.id} delay={i * 100}>
                  <div className="h-full rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="mt-5 font-display font-bold">{p.titulo}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.resumo}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA + LISTA DE ESPERA */}
      <section id="lancamento" className="bg-foreground text-background py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <Reveal>
            <Eyebrow>Lançamento 2026</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              O teu histórico de faturação <span className="text-primary">já vale crédito.</span>
            </h2>
            <p className="mt-5 text-background/70 max-w-md mx-auto">
              Deixa o teu e-mail e avisamos no dia do arranque, antes de abrirmos ao público.
            </p>
            <div className="mt-9 text-left">
              <WaitlistForm />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <Link
                to="/simulador"
                onClick={() => click('cta_final_simulador')}
                className="inline-flex items-center gap-2 text-background/80 hover:text-background transition-colors"
              >
                <Calculator className="w-4 h-4 text-primary" /> Ou experimenta o simulador
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <img src={logoGiro} alt="Giro" className="h-10 object-contain" />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Originação de crédito para empresas angolanas, a partir de dados fiscais
                validados pelo SAF-T (AO).
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Produto</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#como" className="hover:text-foreground transition-colors">Como funciona</a></li>
                <li><a href="#dados" className="hover:text-foreground transition-colors">Dados públicos</a></li>
                <li><a href="#documentos" className="hover:text-foreground transition-colors">Documentos</a></li>
                <li><a href="#confianca" className="hover:text-foreground transition-colors">Validação AGT</a></li>
                <li><a href="#base-legal" className="hover:text-foreground transition-colors">Base legal</a></li>
                <li><a href="#sazonalidade" className="hover:text-foreground transition-colors">Sazonalidade</a></li>
                <li><Link to="/simulador" className="hover:text-foreground transition-colors">Simulador de crédito</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Contacto</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Faktura Angola, Lda · NIF 5002964031<br />Luanda, Angola</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <a href="mailto:geral@faktura.ao" className="hover:text-foreground transition-colors">geral@faktura.ao</a>
                </li>
                <li className="flex gap-4 pt-1">
                  <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
                  <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Faktura Angola, Lda. Todos os direitos reservados.</span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              O Giro não é uma instituição financeira: apresentamos o teu dossier a bancos parceiros.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}