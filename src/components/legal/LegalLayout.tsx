import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import logoGiro from '@/assets/giro-logo-light.svg';
import type { LegalSection } from '@/lib/legal/types';

interface LegalLayoutProps {
  title: string;
  sections: LegalSection[];
  otherPath: string;
  otherLabel: string;
}

const markerPattern = /(\[(?:CONFIRMAR|A PREENCHER):[^\]]+\])/g;
const markerOnlyPattern = /^\[(?:CONFIRMAR|A PREENCHER):[^\]]+\]$/;

function renderText(text: string) {
  return text.split(markerPattern).map((part, index) =>
    markerOnlyPattern.test(part)
      ? <mark key={`${part}-${index}`} className="rounded bg-amber-100 px-1 text-amber-950 print:bg-transparent">{part}</mark>
      : part,
  );
}

function SectionContent({ section, index }: { section: LegalSection; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-b border-border py-8 last:border-0">
      <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
        {String(index + 1).padStart(2, '0')}. {section.title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/85 sm:text-base">
        {section.blocks.map((block, index) => {
          if (block.kind === 'paragraph') {
            return <p key={`${section.id}-${index}`}>{renderText(block.text)}</p>;
          }
          if (block.kind === 'list') {
            return (
              <ul key={`${section.id}-${index}`} className="list-disc space-y-2 pl-6 marker:text-primary">
                {block.items.map(item => <li key={item}>{renderText(item)}</li>)}
              </ul>
            );
          }
          return (
            <div key={`${section.id}-${index}`} className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                <thead className="bg-muted/40 text-foreground">
                  <tr>{block.headers.map(header => <th key={header} scope="col" className="border-b border-border px-4 py-3 font-semibold">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${section.id}-row-${rowIndex}`} className="align-top even:bg-muted/20">
                      {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border-b border-border px-4 py-3 last:border-0">{renderText(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function LegalLayout({ title, sections, otherPath, otherLabel }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{`
        @media print {
          header, footer, aside, .legal-actions, .legal-note { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          section { break-inside: avoid; }
        }
      `}</style>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" aria-label="Giro, página inicial" className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logoGiro} alt="Giro" className="h-9 w-auto object-contain" />
          </Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-4 text-sm">
            <Link to="/" className="hidden text-muted-foreground hover:text-foreground sm:inline">Início</Link>
            <Link to={otherPath} className="text-muted-foreground hover:text-foreground">{otherLabel}</Link>
          </nav>
        </div>
      </header>

      <div className="legal-note border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-xs leading-relaxed text-amber-950 sm:text-sm">
        Documento informativo; deve ser revisto por um advogado antes de publicação.
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-sm font-medium text-primary">Giro · O teu dinheiro em movimento</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Última atualização: 29 de Outubro de 2026</p>
          </div>
          <div className="legal-actions flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="gap-2 focus-visible:ring-2 focus-visible:ring-ring">
              <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12">
          <aside className="md:sticky md:top-24 md:h-fit" aria-label="Índice do documento">
            <details className="group rounded-lg border border-border bg-muted/40 p-4 md:hidden">
              <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Índice do documento</summary>
              <nav className="mt-3 grid gap-2 text-sm">
                {sections.map((section, index) => (
                  <a key={section.id} href={`#${section.id}`} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {String(index + 1).padStart(2, '0')}. {section.title}
                  </a>
                ))}
              </nav>
            </details>
            <nav className="hidden border-l border-border pl-4 md:block" aria-label="Índice">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Neste documento</p>
              <div className="grid max-h-[calc(100vh-9rem)] gap-2 overflow-y-auto text-xs leading-5">
                {sections.map((section, index) => (
                  <a key={section.id} href={`#${section.id}`} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {String(index + 1).padStart(2, '0')}. {section.title}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <main className="min-w-0">
            {sections.map((section, index) => <SectionContent key={section.id} section={section} index={index} />)}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-sm">
              <Link to={otherPath} className="font-medium text-primary underline-offset-4 hover:underline">{otherLabel}</Link>
              <a href="mailto:geral@faktura.ao" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">geral@faktura.ao</a>
            </div>
          </main>
        </div>
      </div>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logoGiro} alt="Giro" className="h-7 w-auto object-contain" />
            <span className="text-muted-foreground">Faktura Angola, Lda · NIF 5002964031</span>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">O Giro não é uma instituição financeira: apresentamos o teu dossier a bancos parceiros.</p>
        </div>
      </footer>
    </div>
  );
}
