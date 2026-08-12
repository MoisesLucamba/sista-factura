import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { readGuest, writeGuest, clearGuest, guestMinutesLeft } from '@/lib/guest';

interface GuestContextType {
  /** Sessão de visitante activa (entrou na plataforma sem conta). */
  isGuest: boolean;
  /** Minutos restantes até a sessão expirar. */
  minutesLeft: number;
  startGuest: () => void;
  endGuest: () => void;
}

const Ctx = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    const data = readGuest<{ mode?: string }>();
    return !!data && data.mode === 'plataforma';
  });
  const [minutesLeft, setMinutesLeft] = useState<number>(() => guestMinutesLeft());

  useEffect(() => {
    const tick = () => {
      const left = guestMinutesLeft();
      setMinutesLeft(left);
      if (left <= 0) {
        const data = readGuest<{ mode?: string }>();
        if (!data) setIsGuest(false);
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const startGuest = useCallback(() => {
    writeGuest({ mode: 'plataforma', startedAt: Date.now() });
    setIsGuest(true);
    setMinutesLeft(guestMinutesLeft());
  }, []);

  const endGuest = useCallback(() => {
    clearGuest();
    setIsGuest(false);
    setMinutesLeft(0);
  }, []);

  const value = useMemo(
    () => ({ isGuest, minutesLeft, startGuest, endGuest }),
    [isGuest, minutesLeft, startGuest, endGuest],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuest() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGuest must be used within a GuestProvider');
  return ctx;
}
