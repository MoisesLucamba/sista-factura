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
  FileText, Building2, TrendingUp, Lock, CalendarClock, Calculator, Mail, Phone, MapPin, Sparkles,
} from 'lucide-react';

const passos = [
  {
    icon: UploadCloud,
    titulo: 'Envia o teu SAF-T',
    texto: 'O ficheiro que o teu software de faturação certificado já gera todos os meses. Sem integrações, sem mudar de sistema.',
  },
  {
    icon: Gauge,
    titulo: 'Recebe o teu score',
    texto: 'Analisamos volume, consistência, crescimento e conformidade fiscal para gerar um score de crédito de 0 a 1000.',
  },
  {
    icon: Banknote,
    titulo: 'Pede capital de giro',
    texto: 'Enviamos o teu dossier já validado aos bancos parceiros. Menos papelada, decisão mais rápida.',
  },
];

const provas = [
  { icon: ShieldCheck, titulo: 'Validação AGT', texto: 'Verificamos estrutura SAF-T (AO), nº de certificado do software, assinaturas digitais e correspondência de NIF.' },
  { icon: Lock, titulo: 'Os teus dados ficam teus', texto: 'O ficheiro é lido no teu dispositivo antes de ser registado. Só partilhamos o dossier quando pedes crédito.' },
  { icon: FileText, titulo: 'Dossier pronto para banco', texto: 'Histórico de faturação, sazonalidade e conformidade fiscal num único documento aceite pelos analistas.' },
];

export default function LandingPage() {
  const click = (label: string) => track({ event: 'click', section: 'landing', label });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPapel} alt="Papel · Faktura Angola" className="h-9 md:h-10 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#como" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#confianca" className="hover:text-foreground transition-colors">Confiança</a>
            <a href="#sazonalidade" className="hover:text-foreground transition-colors">Sazonalidade</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#lancamento" onClick={() => click('nav_avisem_me')}>Avisem-me</a>
            </Button>
            <Button asChild size="sm" onClick={() => click('nav_simulador')}>
              <Link to="/simulador">Simular crédito</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — imagem + descrição, ao estilo clássico */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Descrição */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Em preparação · Lançamento 2026
              </span>
              <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                Crédito de <span className="text-primary">capital de giro</span> para a tua empresa.
              </h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                A Papel transforma o teu histórico de faturação num dossier de crédito que os
                bancos confiam. Envia o teu SAF-T, recebe o teu score e pede capital de giro
                sem papelada.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="h-12 px-8 text-base font-bold">
                  <Link to="/simulador" onClick={() => click('hero_simulador')}>
                    <Calculator className="w-4 h-4 mr-2" /> Simular crédito
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                  <a href="#lancamento" onClick={() => click('hero_avisem_me')}>
                    Avisem-me no lançamento
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Sem cartão. Sem mudar de software de faturação.
              </p>
            </div>

            {/* Imagem */}
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 to-primary/5 blur-3xl" />
              <div className="rounded-3xl overflow-hidden border border-border shadow-2xl">
                <img
                  src={heroBusiness}
                  alt="Empresários angolanos a analisar o desempenho da empresa"
                  className="w-full h-[320px] md:h-[480px] object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-5 left-6 bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Capital de giro</p>
                  <p className="text-xs text-muted-foreground">Baseado nas tuas vendas reais</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="relative overflow-hidden border-t border-border/60 py-24 lg:py-32">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Imagem do tecido empresarial */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/25 to-primary/5 blur-2xl -z-10" />
              <div className="rounded-3xl overflow-hidden border border-primary/20 shadow-2xl">
                <img
                  src={tecidoEmpresarial}
                  alt="Tecido empresarial angolano: costureiro, padaria, advogados e vendedores"
                  width={1280}
                  height={720}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-card border border-border rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                    +
                  </span>
                  <div>
                    <p className="text-sm font-bold">PMEs e grandes empresas</p>
                    <p className="text-xs text-muted-foreground">Do comercial ao corporativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passos */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <UploadCloud className="w-3.5 h-3.5" /> Três passos
              </span>
              <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight">
                Deixa o teu <span className="text-primary">histórico de faturação</span> trabalhar por ti.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Envias o ficheiro SAF-T uma vez. Nós validamos, calculamos o score e apresentamos o teu dossier aos bancos parceiros.
              </p>

              <div className="mt-8 space-y-4">
                {passos.map((p, i) => (
                  <div
                    key={p.titulo}
                    className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.25)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <p.icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold">{p.titulo}</h3>
                          <span className="text-xs font-black text-muted-foreground/40">0{i + 1}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.texto}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section id="confianca" className="border-t border-border/60 py-20 bg-card/40">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Confiança que vem da <span className="text-primary">conformidade fiscal</span>.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada ficheiro enviado passa por um relatório de validação automático. Só dados validados
                entram no cálculo do score — é isso que dá credibilidade ao teu dossier junto dos bancos.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'Estrutura SAF-T (AO) reconhecida',
                  'Nº de certificado AGT do software emissor',
                  'Assinatura digital e HashControl dos documentos',
                  'NIF do ficheiro corresponde ao NIF da empresa',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4">
              {provas.map(p => (
                <div key={p.titulo} className="rounded-2xl border border-border bg-background p-6 flex gap-4">
                  <span className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">{p.titulo}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SAZONALIDADE */}
      <section id="sazonalidade" className="border-t border-border/60 py-20">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="w-3.5 h-3.5 text-primary" /> Incluído na tua conta
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl font-black tracking-tight">
            Sabe o teu pico de procura antes de pedir crédito.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A partir das linhas dos teus documentos mostramos os produtos mais comprados, o mês de pico
            e o mês de escassez — para pedires capital de giro no momento em que ele rende mais.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
            {[
              { icon: TrendingUp, t: 'Produtos mais comprados', d: 'Ranking por quantidade e valor facturado.' },
              { icon: CalendarClock, t: 'Pico e escassez', d: 'Curva anual de procura, mês a mês.' },
              { icon: Banknote, t: 'Melhor época de pedido', d: 'Sugestão de quando avançar com o crédito.' },
            ].map(c => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
                <c.icon className="w-5 h-5 text-primary" />
                <h3 className="mt-3 font-bold text-sm">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRÉDITO EM IMAGENS */}
      <section className="border-t border-border/60 py-20">
        <div className="max-w-6xl mx-auto px-5 grid gap-10 lg:grid-cols-2 items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src={creditoPme} alt="Empresário angolano a rever a faturação da sua loja num tablet"
              loading="lazy" width={1280} height={860}
              className="rounded-2xl border border-border object-cover h-56 sm:h-72 w-full"
            />
            <img
              src={bancoAnalise} alt="Analistas de banco a avaliar um dossier de crédito"
              loading="lazy" width={1280} height={860}
              className="rounded-2xl border border-border object-cover h-56 sm:h-72 w-full sm:mt-10"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Do balcão da tua loja à mesa do comité de crédito.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A PME envia o SAF-T. A Papel valida, calcula o score e monta o dossier. O banco recebe tudo
              organizado e decide — com cada passo registado no trilho de auditoria.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Dossier completo: SAF-T, score, sazonalidade e documentos de suporte',
                'Decisões e desembolsos registados e exportáveis',
                'A PME acompanha o estado do pedido em tempo real',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PERFIS — promessa, sem registo ainda */}
      <section id="perfis" className="border-t border-border/60 py-20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12),transparent_65%)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-bold text-primary">
              Quatro perfis, um só circuito
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight">
              Seja quem fores, tens lugar na Papel.
            </h2>
            <p className="mt-3 text-muted-foreground">
              No lançamento, cada perfil terá o seu próprio espaço — com só os dados que precisa.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERFIS.map(p => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-primary/25 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_18px_40px_-24px_hsl(var(--primary))]"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-4 font-black">{p.titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.resumo}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border/60 py-20">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            O teu histórico de faturação já vale crédito.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Experimenta o simulador agora e deixa o teu e-mail para entrares primeiro no lançamento.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
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

      {/* LANÇAMENTO / LISTA DE ESPERA */}
      <section id="lancamento" className="relative overflow-hidden border-t border-border/60 py-24 bg-card/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,hsl(var(--primary)/0.14),transparent_70%)]" />
        <div className="max-w-3xl mx-auto px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Lançamento 2026
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl font-black tracking-tight">
            Entra primeiro na lista.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Deixa o teu e-mail e avisamos no dia do arranque — antes de abrirmos ao público.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <img src={logoPapel} alt="Papel" className="h-11 object-contain" />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Originação de crédito para empresas angolanas, a partir de dados fiscais
                validados pelo SAF-T (AO).
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Validação AGT
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold">Produto</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#como" className="hover:text-foreground transition-colors">Como funciona</a></li>
                <li><a href="#confianca" className="hover:text-foreground transition-colors">Validação AGT</a></li>
                <li><a href="#sazonalidade" className="hover:text-foreground transition-colors">Sazonalidade</a></li>
                <li><Link to="/simulador" className="hover:text-foreground transition-colors">Simulador de crédito</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold">Empresa</h3>
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

          <div className="mt-12 pt-6 border-t border-border/60 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
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
