/**
 * Modo visitante — dados guardados apenas no localStorage e apagados
 * automaticamente ao fim de 2 horas. Nada é enviado para o servidor.
 */
const KEY = 'papel_guest_session';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

export interface GuestSession<T = Record<string, unknown>> {
  createdAt: number;
  data: T;
}

export function readGuest<T = Record<string, unknown>>(): T | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSession<T>;
    if (!parsed?.createdAt || Date.now() - parsed.createdAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.data;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function writeGuest<T = Record<string, unknown>>(data: T): void {
  try {
    const existing = localStorage.getItem(KEY);
    let createdAt = Date.now();
    if (existing) {
      const parsed = JSON.parse(existing) as GuestSession;
      if (parsed?.createdAt && Date.now() - parsed.createdAt <= TTL_MS) {
        createdAt = parsed.createdAt;
      }
    }
    localStorage.setItem(KEY, JSON.stringify({ createdAt, data }));
  } catch {
    /* storage indisponível — o modo visitante continua a funcionar em memória */
  }
}

export function clearGuest(): void {
  localStorage.removeItem(KEY);
}

/** Minutos restantes antes de a sessão de visitante expirar (0 se não existir). */
export function guestMinutesLeft(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as GuestSession;
    const left = TTL_MS - (Date.now() - parsed.createdAt);
    return left > 0 ? Math.ceil(left / 60000) : 0;
  } catch {
    return 0;
  }
}
