import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { track } from '@/lib/track';
import logoPapel from '@/assets/faktura-logo.png';
import heroBusiness from '@/assets/hero-business.jpg';
import tecidoEmpresarial from '@/assets/tecido-empresarial.jpg';
import creditoPme from '@/assets/credito-pme.jpg';
import bancoAnalise from '@/assets/banco-analise.jpg';
import { PERFIS } from '@/lib/perfis';
import {
  ArrowRight, ShieldCheck, UploadCloud, Gauge, Banknote, CheckCircle2,
  FileText, Building2, TrendingUp, Lock, CalendarClock, Calculator, Mail, Phone, MapPin,
} from 'lucide-react';

/* Etiqueta editorial — substitui os "pills" com ícones decorativos */
const Eyebrow = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <span
    className={`inline-flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.28em] ${
      dark ? 'text-primary' : 'text-muted-foreground'
    }`}
  >
    <span className="h-px w-8 bg-primary" aria-hidden />
    {children}
  </span>
);

/* Banda escura com numeração editorial */
const SectionHead = ({
  numero,
  eyebrow,
  titulo,
  intro,
  dark = false,
  center = false,
}: {
  numero: string;
  eyebrow: string;
  titulo: React.ReactNode;
  intro?: string;
  dark?: boolean;
  center?: boolean;
}) => (
  <div className={center ? 'text-center' : ''}>
    <div className="flex items-baseline justify-between gap-6">
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground/60">{numero}</span>
    </div>
    <h2
      className={`mt-4 font-display text-3xl md:text-[2.75rem] leading-[1.08] tracking-tight ${
        dark ? 'text-background' : 'text-foreground'
      } ${center ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
    >
      {titulo}
    </h2>
    {intro && (
      <p className={`mt-4 max-w-xl leading-relaxed text-muted-foreground ${center ? 'mx-auto' : ''}`}>{intro}</p>
    )}
  </div>
);

const passos = [
  {
    titulo: 'Envia o teu SAF-T',
    texto: 'O ficheiro que o teu software de faturação certificado já gera todos os meses. Sem integrações, sem mudar de sistema.',
  },
  {
    titulo: 'Recebe o teu score',
    texto: 'Analisamos volume, consistência, crescimento e conformidade fiscal para gerar um score de crédito de 0 a 1000.',
  },
  {
    titulo: 'Pede capital de giro',
    texto: 'Enviamos o teu dossier já validado aos bancos parceiros. Menos papelada, decisão mais rápida.',
  },
];

const provas = [
  { icon: ShieldCheck, titulo: 'Validação AGT', texto: 'Estrutura SAF-T (AO), nº de certificado do software, assinaturas digitais e correspondência de NIF.' },
  { icon: Lock, titulo: 'Os teus dados ficam teus', texto: 'O ficheiro é lido no teu dispositivo antes de ser registado. Só partilhamos o dossier quando pedes crédito.' },
  { icon: FileText, titulo: 'Dossier pronto para banco', texto: 'Histórico de faturação, sazonalidade e conformidade fiscal num único documento aceite pelos analistas.' },
];

/* Curva anual decorativa — pico em Abril, escassez em Janeiro */
const meses = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const procura = [22, 30, 48, 92, 74, 60, 52, 58, 66, 55, 44, 30];
const picoIdx = 3;

export default function LandingPage() {
  const click = (label: string) => track({ event: 'click', section: 'landing', label });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPapel} alt="Papel · Faktura Angola" className="h-9 md:h-10 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <a href="#como" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#confianca" className="hover:text-foreground transition-colors">Confiança</a>
            <a href="#sazonalidade" className="hover:text-foreground transition-colors">Sazonalidade</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex font-mono text-xs uppercase tracking-wider">
              <a href="#lancamento" onClick={() => click('nav_avisem_me')}>Avisem-me</a>
            </Button>
            <Button asChild size="sm" onClick={() => click('nav_simulador')}>
              <Link to="/simulador">Simular crédito</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — banda escura, tipografia grande, imagem emoldurada como documento */}
      <section className="relative bg-foreground text-background">
        {/* fio âmbar no topo, como lombada de dossier */}
        <div className="h-1 bg-primary" aria-hidden />
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <div>
              <Eyebrow dark>Originação de crédito · Luanda</Eyebrow>
              <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.03] text-background">
                Capital de giro para a tua empresa,{' '}
                <span className="text-primary">baseado no que já vendes.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-background/70">
                A Papel transforma o teu histórico de faturação num dossier de crédito que os
                bancos confiam. Envia o teu SAF-T, recebe o teu score e pede capital de giro
                sem papelada.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="h-12 px-8 text-base font-bold">
                  <Link to="/simulador" onClick={() => click('hero_simulador')}>
                    <Calculator className="w-4 h-4 mr-2" /> Simular crédito
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base border-background/25 text-background hover:bg-background/10 hover:text-background"
                >
                  <a href="#lancamento" onClick={() => click('hero_avisem_me')}>
                    Avisem-me no lançamento
                  </a>
                </Button>
              </div>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-background/50">
                Sem cartão · Sem mudar de software de faturação
              </p>
            </div>

            {/* Imagem com moldura deslocada, estilo documento arquivado */}
            <div className="relative mt-4 lg:mt-0">
              <div className="absolute -top-3 -left-3 h-full w-full border border-primary/60" aria-hidden />
              <div className="relative bg-background p-2">
                <img
                  src={heroBusiness}
                  alt="Empresários angolanos a analisar o desempenho da empresa"
                  className="w-full h-[320px] md:h-[460px] object-cover"
                  loading="eager"
                />
              </div>
              <div className="relative flex items-center justify-between bg-primary px-4 py-3">
                <p className="font-display text-sm font-bold text-primary-foreground">Capital de giro</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/80">
                  Baseado nas tuas vendas reais
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA — lista numerada com fios, sem cards */}
      <section id="como" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <SectionHead
                numero="01"
                eyebrow="Como funciona"
                titulo={<>Deixa o teu <span className="text-primary">histórico de faturação</span> trabalhar por ti.</>}
                intro="Envias o ficheiro SAF-T uma vez. Nós validamos, calculamos o score e apresentamos o teu dossier aos bancos parceiros."
              />
              <div className="relative mt-10 hidden lg:block">
                <div className="absolute -top-3 -left-3 h-full w-full border border-border" aria-hidden />
                <div className="relative bg-background p-2">
                  <img
                    src={tecidoEmpresarial}
                    alt="Tecido empresarial angolano: costureiro, padaria, advogados e vendedores"
                    width={1280}
                    height={720}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="relative flex items-center justify-between bg-foreground px-4 py-3">
                  <p className="font-display text-sm font-bold text-background">Do comercial ao corporativo</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/60">PMEs e grandes empresas</p>
                </div>
              </div>
            </div>

            <ol className="divide-y divide-border border-y border-border">
              {passos.map((p, i) => (
                <li key={p.titulo} className="group grid grid-cols-[auto_1fr] gap-5 py-7">
                  <span className="font-mono text-2xl text-primary/90 tabular-nums leading-none pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
                      {p.titulo}
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="relative lg:hidden">
              <div className="relative bg-background p-2 border border-border">
                <img
                  src={tecidoEmpresarial}
                  alt="Tecido empresarial angolano: costureiro, padaria, advogados e vendedores"
                  width={1280}
                  height={720}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between bg-foreground px-4 py-3">
                <p className="font-display text-sm font-bold text-background">Do comercial ao corporativo</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/60">PMEs e grandes empresas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANÇA — banda escura */}
      <section id="confianca" className="bg-foreground text-background py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <SectionHead
            numero="02"
            eyebrow="Confiança"
            dark
            titulo={<>Confiança que vem da <span className="text-primary">conformidade fiscal</span>.</>}
            intro="Cada ficheiro enviado passa por um relatório de validação automático. Só dados validados entram no cálculo do score — é isso que dá credibilidade ao teu dossier junto dos bancos."
          />

          <div className="mt-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-12">
            <ul className="divide-y divide-background/15 border-y border-background/15">
              {[
                'Estrutura SAF-T (AO) reconhecida',
                'Nº de certificado AGT do software emissor',
                'Assinatura digital e HashControl dos documentos',
                'NIF do ficheiro corresponde ao NIF da empresa',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 py-4 text-sm text-background/85">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="grid sm:grid-cols-3 gap-px bg-background/15 border border-background/15">
              {provas.map(p => (
                <div key={p.titulo} className="bg-foreground p-6 flex flex-col">
                  <p.icon className="w-5 h-5 text-primary" />
                  <h3 className="mt-4 font-display font-bold text-sm text-background">{p.titulo}</h3>
                  <p className="mt-2 text-xs text-background/65 leading-relaxed">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SAZONALIDADE — com curva anual tipográfica */}
      <section id="sazonalidade" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <SectionHead
            numero="03"
            eyebrow="Sazonalidade"
            titulo="Sabe o teu pico de procura antes de pedir crédito."
            intro="A partir das linhas dos teus documentos mostramos os produtos mais comprados, o mês de pico e o mês de escassez — para pedires capital de giro no momento em que ele rende mais."
          />

          <div className="mt-12 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-end">
            {/* Gráfico de barras tipográfico */}
            <div className="border border-border p-6 md:p-8">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>Procura · Ano típico</span>
                <span className="text-primary">Pico em Abril</span>
              </div>
              <div className="mt-6 flex items-end gap-1.5 sm:gap-2.5 h-40">
                {procura.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full ${i === picoIdx ? 'bg-primary' : 'bg-primary/25'}`}
                      style={{ height: `${v}%` }}
                    />
                    <span className={`font-mono text-[10px] ${i === picoIdx ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}>
                      {meses[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-px bg-border border border-border">
              {[
                { icon: TrendingUp, t: 'Produtos mais comprados', d: 'Ranking por quantidade e valor facturado.' },
                { icon: CalendarClock, t: 'Pico e escassez', d: 'Curva anual de procura, mês a mês.' },
                { icon: Banknote, t: 'Melhor época de pedido', d: 'Sugestão de quando avançar com o crédito.' },
              ].map(c => (
                <div key={c.t} className="bg-background p-6">
                  <div className="flex items-center gap-3">
                    <c.icon className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-display font-bold text-sm">{c.t}</h3>
                  </div>
                  <p className="mt-1.5 pl-7 text-sm text-muted-foreground">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DO BALCÃO À MESA DO COMITÉ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5 grid gap-12 lg:grid-cols-2 items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border p-1.5 bg-background">
              <img
                src={creditoPme} alt="Empresário angolano a rever a faturação da sua loja num tablet"
                loading="lazy" width={1280} height={860}
                className="object-cover h-56 sm:h-72 w-full"
              />
            </div>
            <div className="border border-border p-1.5 bg-background sm:mt-10">
              <img
                src={bancoAnalise} alt="Analistas de banco a avaliar um dossier de crédito"
                loading="lazy" width={1280} height={860}
                className="object-cover h-56 sm:h-72 w-full"
              />
            </div>
          </div>
          <div>
            <SectionHead
              numero="04"
              eyebrow="O circuito"
              titulo="Do balcão da tua loja à mesa do comité de crédito."
              intro="A PME envia o SAF-T. A Papel valida, calcula o score e monta o dossier. O banco recebe tudo organizado e decide — com cada passo registado no trilho de auditoria."
            />
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {[
                'Dossier completo: SAF-T, score, sazonalidade e documentos de suporte',
                'Decisões e desembolsos registados e exportáveis',
                'A PME acompanha o estado do pedido em tempo real',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 py-3.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PERFIS — grelha regrada, sem cards flutuantes */}
      <section id="perfis" className="py-20 lg:py-28 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-5">
          <SectionHead
            numero="05"
            eyebrow="Quatro perfis"
            center
            titulo="Seja quem fores, tens lugar na Papel."
            intro="No lançamento, cada perfil terá o seu próprio espaço — com só os dados que precisa."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {PERFIS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.id} className="bg-background p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-mono text-[10px] text-muted-foreground/50">0{i + 1}</span>
                  </div>
                  <p className="mt-5 font-display font-bold">{p.titulo}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.resumo}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Eyebrow>Começa agora</Eyebrow>
          <h2 className="mt-5 font-display text-3xl md:text-[2.75rem] leading-[1.08] tracking-tight">
            O teu histórico de faturação <span className="text-primary">já vale crédito.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Experimenta o simulador agora e deixa o teu e-mail para entrares primeiro no lançamento.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base font-bold">
              <Link to="/simulador" onClick={() => click('cta_final_simulador')}>
                <Calculator className="w-4 h-4 mr-2" /> Simular crédito
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <a href="#lancamento" onClick={() => click('cta_final_avisem_me')}>Avisem-me no lançamento</a>
            </Button>
          </div>
        </div>
      </section>

      {/* LANÇAMENTO / LISTA DE ESPERA — banda escura */}
      <section id="lancamento" className="bg-foreground text-background py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-5">
          <div className="border border-background/15 p-8 md:p-12">
            <div className="flex items-baseline justify-between gap-6">
              <Eyebrow dark>Lançamento 2026</Eyebrow>
              <span className="font-mono text-[11px] tracking-[0.3em] text-background/40">06</span>
            </div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold tracking-tight text-background">
              Entra primeiro na lista.
            </h2>
            <p className="mt-4 text-background/70 max-w-lg">
              Deixa o teu e-mail e avisamos no dia do arranque — antes de abrirmos ao público.
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-primary bg-background">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <img src={logoPapel} alt="Papel" className="h-11 object-contain" />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Originação de crédito para empresas angolanas, a partir de dados fiscais
                validados pelo SAF-T (AO).
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Validação AGT
              </p>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">Produto</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#como" className="hover:text-foreground transition-colors">Como funciona</a></li>
                <li><a href="#confianca" className="hover:text-foreground transition-colors">Validação AGT</a></li>
                <li><a href="#sazonalidade" className="hover:text-foreground transition-colors">Sazonalidade</a></li>
                <li><Link to="/simulador" className="hover:text-foreground transition-colors">Simulador de crédito</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">Empresa</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Faktura Angola, Lda · NIF 5002964031</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Luanda, Angola</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <a href="mailto:geral@faktura.ao" className="hover:text-foreground transition-colors">geral@faktura.ao</a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <a href="tel:+244900000000" className="hover:text-foreground transition-colors">+244 900 000 000</a>
                </li>
                <li className="flex gap-4 pt-2">
                  <Link to="/termos" className="hover:text-foreground transition-colors">Termos de uso</Link>
                  <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row gap-3 items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>© {new Date().getFullYear()} Faktura Angola, Lda. Todos os direitos reservados.</span>
            <span className="inline-flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Papel não é uma instituição financeira: apresentamos o teu dossier a bancos parceiros.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
