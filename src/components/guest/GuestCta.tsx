import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus, ArrowRight } from 'lucide-react';

interface Props {
  minutesLeft?: number;
}

export function GuestCta({ minutesLeft }: Props) {
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
      <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
      </span>
      <div className="flex-1">
        <h3 className="font-bold">Cria uma conta para explorar melhor</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Estás em modo visitante: nada é guardado no servidor e os dados desaparecem
          {typeof minutesLeft === 'number' && minutesLeft > 0 ? ` em ${minutesLeft} min` : ' ao fim de 2 horas'}.
          Com conta vês funcionalidades em tempo real, envias o teu SAF-T e podes pedir crédito.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button asChild variant="outline">
          <Link to="/login">Entrar</Link>
        </Button>
        <Button asChild className="font-bold">
          <Link to="/registar">
            <UserPlus className="w-4 h-4 mr-2" /> Criar conta <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
