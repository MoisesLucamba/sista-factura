import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CompanyAccount {
  empresa_user_id: string;
  nome: string;
  email: string;
  faktura_id: string | null;
  role: string; // owner | gestor | operador | contador | visualizador
  is_owner: boolean;
}

interface ActiveAccountContextType {
  companies: CompanyAccount[];
  activeAccount: CompanyAccount | null;
  loading: boolean;
  needsSelection: boolean;
  setActiveAccount: (acc: CompanyAccount) => void;
  clearActive: () => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'faktura.activeAccount';
const Ctx = createContext<ActiveAccountContextType | undefined>(undefined);

export function ActiveAccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<CompanyAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setActiveAccountState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_user_companies', { _user_id: user.id });
    if (error) {
      console.warn('get_user_companies error', error);
      setCompanies([]);
    } else {
      const list = (data || []) as CompanyAccount[];
      setCompanies(list);

      // Restore from storage if still valid
      const stored = localStorage.getItem(STORAGE_KEY);
      let restored: CompanyAccount | null = null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          restored = list.find(c => c.empresa_user_id === parsed.empresa_user_id) || null;
        } catch { /* ignore */ }
      }
      if (restored) {
        setActiveAccountState(restored);
      } else if (list.length === 1) {
        setActiveAccountState(list[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list[0]));
      } else {
        setActiveAccountState(null); // force selector
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setActiveAccount = (acc: CompanyAccount) => {
    setActiveAccountState(acc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(acc));
  };

  const clearActive = () => {
    setActiveAccountState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const needsSelection = !!user && !loading && companies.length > 1 && !activeAccount;

  return (
    <Ctx.Provider value={{ companies, activeAccount, loading, needsSelection, setActiveAccount, clearActive, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveAccount() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActiveAccount must be used within ActiveAccountProvider');
  return ctx;
}
