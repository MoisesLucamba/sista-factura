import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SimuladorCredito } from '@/components/credito/SimuladorCredito';
import { GuestCta } from '@/components/guest/GuestCta';
import logoPapel from '@/assets/faktura-logo.png';
import { ArrowLeft } from 'lucide-react';

export default function Simulador() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPapel} alt="Papel" className="h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/explorar">Modo visitante</Link></Button>
            <Button asChild size="sm"><Link to="/registar">Criar conta</Link></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 space-y-8">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
            Simulador de crédito
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Introduz os teus números de faturação e vê, em segundos, o score estimado, o limite
            de capital de giro recomendado e a prestação aproximada.
          </p>
        </div>

        <SimuladorCredito persistGuest />

        <GuestCta />
      </main>
    </div>
  );
}
