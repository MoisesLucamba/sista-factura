import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGuest } from '@/contexts/GuestContext';
import { Timer, UserPlus, LogOut } from 'lucide-react';

/** Barra fixa mostrada em toda a plataforma enquanto a sessão de visitante estiver activa. */
export function GuestBanner() {
  const { isGuest, minutesLeft, endGuest } = useGuest();
  const navigate = useNavigate();

  if (!isGuest) return null;

  const sair = () => {
    endGuest();
    navigate('/');
  };

  return (
    <div className="w-full border-b border-primary/40 bg-primary/10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Timer className="w-3.5 h-3.5" />
          Modo visitante{minutesLeft > 0 ? ` · ${minutesLeft} min restantes` : ' · expirado'}
        </span>
        <span className="text-xs text-muted-foreground flex-1 min-w-[200px]">
          Nada é guardado no servidor — os dados ficam só neste dispositivo e apagam-se ao fim de 2 horas.
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={sair}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sair
          </Button>
          <Button asChild size="sm" className="font-bold">
            <Link to="/registar">
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Criar conta
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
