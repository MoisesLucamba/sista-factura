// Lightweight click/event tracker for the public landing page.
// Writes to `landing_events` (public INSERT via RLS).
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'fkt_session_id';

function getSessionId(): string {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return 'anon';
  }
}

export interface TrackPayload {
  event: string;              // e.g. 'click', 'view', 'submit'
  section?: string;           // e.g. 'hero', 'arquivos', 'nav', 'footer'
  label?: string;             // e.g. 'cta_arquivos', 'cta_faktura_waitlist'
  url?: string;               // destination url if link
  metadata?: Record<string, unknown>;
}

export async function track({ event, section, label, url, metadata }: TrackPayload) {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from('landing_events').insert({
      event_name: event,
      section: section ?? null,
      label: label ?? null,
      url: url ?? (typeof window !== 'undefined' ? window.location.href : null),
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      session_id: getSessionId(),
      user_id: data.user?.id ?? null,
      metadata: metadata ?? {},
    });
  } catch (err) {
    // never break UX on tracking failure
    console.debug('[track] failed', err);
  }
}
