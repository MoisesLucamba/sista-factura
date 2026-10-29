import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { COOKIE_CONSENT_KEY, readCookieConsent, type CookieConsent } from '@/lib/legal/consent';

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readCookieConsent());

  const choose = (analytics: boolean) => {
    const choice = { analytics, decidedAt: new Date().toISOString() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(choice));
    setConsent(choice);
  };

  if (consent) return null;

  return (
    <aside
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background p-4 shadow-[0_-8px_28px_rgba(0,0,0,.12)] sm:p-5"
      role="dialog"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">
          O Giro usa armazenamento essencial para funcionar. A analítica de utilização só é activada se aceitares cookies não essenciais. Podes alterar esta escolha limpando os dados locais do site.
        </p>
        <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row">
          <Button type="button" variant="outline" onClick={() => choose(false)}>Recusar não essenciais</Button>
          <Button type="button" onClick={() => choose(true)}>Aceitar</Button>
        </div>
      </div>
    </aside>
  );
}
