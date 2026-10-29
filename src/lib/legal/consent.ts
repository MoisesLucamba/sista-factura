import { supabase } from '@/integrations/supabase/client';

export const COOKIE_CONSENT_KEY = 'giro.cookie_consent.v1';
export const SAFT_ANALYSIS_VERSION = '2026-10-29-v1';

export interface CookieConsent {
  analytics: boolean;
  decidedAt: string;
}

export type ConsentType = 'saft_analysis' | 'bank_share';

export interface RecordConsentInput {
  consent_type: ConsentType;
  granted: boolean;
  document_version: string;
  bank_id?: string;
  request_id?: string;
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    return typeof parsed.analytics === 'boolean' ? parsed : null;
  } catch {
    return null;
  }
}

export async function recordConsent(input: RecordConsentInput): Promise<void> {
  const { error } = await supabase.functions.invoke('record-consent', { body: input });
  if (error) throw error;
}

export async function prepareRegistrationConsent(input: {
  email: string;
  terms_version: string;
  privacy_version: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke('registration-consent', {
    body: { action: 'prepare', ...input },
  });
  if (error) throw error;
  if (!data?.nonce) throw new Error('Não foi possível registar o aceite dos documentos.');
  return data.nonce as string;
}

export async function cancelRegistrationConsent(nonce: string): Promise<void> {
  await supabase.functions.invoke('registration-consent', {
    body: { action: 'cancel', nonce },
  });
}
