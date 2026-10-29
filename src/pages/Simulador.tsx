import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SimuladorCredito } from '@/components/credito/SimuladorCredito';
import { GuestCta } from '@/components/guest/GuestCta';
import { track } from '@/lib/track';
import logoGiro from '@/assets/giro-logo-light.svg';
import { ArrowLeft, Info, ChevronDown } from 'lucide-react';

const faq = [
  {
    pergunta: 'O score do simulador é o meu score real?',
    resposta:
      'Não. É uma estimativa feita com os números que introduzes. O score real só é calculado depois de enviares o teu SAF-T, que é validado segundo as regras da AGT.',
  },
  {
    pergunta: 'Preciso de criar conta para simular?',
    resposta:
      'Não. Podes simular em modo visitante. A conta serve para enviares o SAF-T, receberes o score real e pedires capital de giro.',
  },
  {
    pergunta: 'O Giro aprova o crédito?',
    resposta:
      'Não. O Giro prepara o teu dossier e apresenta-o a bancos parceiros. É o banco que avalia, decide e desembolsa, e o dinheiro nunca passa pelo Giro.',
  },
  {
    pergunta: 'Que documentos vou precisar além do SAF-T?',
    resposta:
      'O banco pede também documentos da empresa, como certidões fiscais e de registo comercial. Temos uma lista de referência na página inicial.',
    link: { href: '/#documentos', texto: 'Ver a lista de documentos' },
  },
];

export default function Simulador() {
  const click = (label: string) => track({ event: 'click', section: 'simulador', label });

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Simulador de crédito · Giro';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <a
        href="#simulador"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar para o simulador
      </a>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Giro, página inicial">
            <img src={logoGiro} alt="Giro" className="h-9 object-contain" />
          </Link>
          <nav className="flex items-center gap-2" aria-label="Acesso">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login" onClick={() => click('header_entrar')}>Entrar</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/explorar" onClick={() => click('header_visitante')}>Modo visitante</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/registar" onClick={() => click('header_criar_conta')}>Criar conta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="simulador" className="max-w-6xl mx-auto px-5 py-10 md:py-14 space-y-10">
        <div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Voltar
          </Link>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-primary">Simulador</p>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Simulador de <span className="text-primary">crédito.</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
            Introduz os teus números de faturação e vê, em segundos, o score estimado, o limite
            de capital de giro recomendado e a prestação aproximada.
          </p>
        </div>

        {/* Aviso de resultado indicativo */}
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 md:p-5 text-sm leading-relaxed text-muted-foreground"
        >
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            <strong className="text-foreground">Resultado indicativo.</strong> Não é uma oferta nem uma
            aprovação de crédito. As condições, a decisão e o desembolso são do banco, e o Giro não é uma
            instituição financeira.
          </p>
        </div>

        <SimuladorCredito persistGuest />

        <GuestCta />

        {/* Perguntas frequentes */}
        <section aria-labelledby="faq-titulo" className="max-w-3xl">
          <h2 id="faq-titulo" className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            Perguntas frequentes
          </h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
            {faq.map((f) => (
              <details key={f.pergunta} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.pergunta}
                  <ChevronDown
                    className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.resposta}</p>
                {f.link && (
                  <a
                    href={f.link.href}
                    onClick={() => click('faq_documentos')}
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {f.link.texto}
                  </a>
                )}
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Faktura Angola, (SU) Lda. Todos os direitos reservados.</span>
          <span className="flex gap-4">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}