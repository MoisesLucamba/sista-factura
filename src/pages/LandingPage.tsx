import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/track';
import logoPapel from '@/assets/faktura-logo.png';
import heroBusiness from '@/assets/hero-business.jpg';
import {
  ArrowRight, ShieldCheck, UploadCloud, Gauge, Banknote, CheckCircle2,
  FileText, Building2, TrendingUp, Lock, CalendarClock, Calculator, Mail, Phone, MapPin,
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
            <Link to="/simulador" className="hover:text-foreground transition-colors">Simulador</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/explorar" onClick={() => click('nav_login')}>Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/explorar" onClick={() => click('nav_comecar_gratis')}>Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="w-3.5 h-3.5" /> Validado com base no SAF-T (AO) da AGT
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Capital de giro para a tua empresa,<br className="hidden md:block" />
            <span className="text-primary"> baseado no teu histórico de faturação.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Envia o teu ficheiro SAF-T, recebe um score de crédito construído com dados fiscais reais
            e apresenta-te aos bancos com um dossier que eles confiam.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base font-bold">
              <Link to="/explorar" onClick={() => click('hero_comecar_gratis')}>
                Começar Grátis <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link to="/simulador" onClick={() => click('hero_simulador')}>
                <Calculator className="w-4 h-4 mr-2" /> Simular crédito
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão. Sem mudar de software de faturação.
          </p>

          {/* Imagem principal */}
          <div className="mt-14 relative">
            <div className="absolute -inset-x-6 -top-6 bottom-10 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl" />
            <div className="rounded-3xl overflow-hidden border border-border shadow-2xl">
              <img
                src={heroBusiness}
                alt="Empresários angolanos a analisar o desempenho da empresa"
                className="w-full h-[280px] md:h-[440px] object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>


      {/* COMO FUNCIONA */}
      <section id="como" className="border-t border-border/60 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-black text-center tracking-tight">Três passos. Um dossier de crédito.</h2>
          <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
            Não emitimos faturas. Lemos as que já emitiste.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {passos.map((p, i) => (
              <div key={p.titulo} className="rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-primary" />
                  </span>
                  <span className="text-4xl font-black text-muted-foreground/20">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{p.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.texto}</p>
              </div>
            ))}
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

      {/* PERFIS */}
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
              Cria a tua conta em menos de dois minutos. Só te pedimos os dados que o teu perfil precisa.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERFIS.map(p => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.id}
                  to={`/registar?perfil=${p.id}`}
                  onClick={() => click(`cta_perfil_${p.id}`)}
                  className="group rounded-2xl border border-primary/25 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_18px_40px_-24px_hsl(var(--primary))]"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-4 font-black">{p.titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.resumo}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    Começar <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-20">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            O teu histórico de faturação já vale crédito.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cria a tua conta, envia o primeiro SAF-T e vê o teu score em minutos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base font-bold">
              <Link to="/explorar" onClick={() => click('cta_final_comecar_gratis')}>
                Começar Grátis <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link to="/simulador" onClick={() => click('cta_final_simulador')}>
                <Calculator className="w-4 h-4 mr-2" /> Simular crédito
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
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
                <li><Link to="/explorar" className="hover:text-foreground transition-colors">Modo visitante</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold">Conta</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link></li>
                <li><Link to="/registar" className="hover:text-foreground transition-colors">Criar conta</Link></li>
                <li><Link to="/recuperar-senha" className="hover:text-foreground transition-colors">Recuperar palavra-passe</Link></li>
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Política de privacidade</Link></li>
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
