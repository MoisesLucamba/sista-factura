import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimuladorCredito } from '@/components/credito/SimuladorCredito';
import { GuestCta } from '@/components/guest/GuestCta';
import { useGuest } from '@/contexts/GuestContext';
import { guestMinutesLeft, writeGuest, readGuest } from '@/lib/guest';
import logoPapel from '@/assets/faktura-logo.png';
import {
  UploadCloud, Gauge, Banknote, BarChart3, Building2, ShieldAlert, Lock, Timer, ArrowRight,
} from 'lucide-react';


const modulos = [
  { icon: UploadCloud, t: 'Enviar SAF-T', d: 'Validação AGT do ficheiro e leitura do histórico de faturação.' },
  { icon: Gauge, t: 'Score de crédito', d: 'Pontuação 0–1000 com base em volume, consistência e conformidade.' },
  { icon: Banknote, t: 'Pedidos de crédito', d: 'Dossier enviado aos bancos parceiros com um clique.' },
  { icon: BarChart3, t: 'Sazonalidade', d: 'Produtos mais vendidos, mês de pico e melhor época para pedir crédito.' },
  { icon: Building2, t: 'A minha empresa', d: 'NIF, IBAN, banco e certificado do software de faturação.' },
  { icon: ShieldAlert, t: 'Seguros PME', d: 'Pedidos de seguro para a tua empresa junto de parceiros.' },
];

export default function Explorar() {
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    if (!readGuest()) writeGuest({ startedAt: Date.now() });
    const tick = () => setMinutos(guestMinutesLeft());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPapel} alt="Papel" className="h-9 object-contain" />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Timer className="w-3.5 h-3.5 text-primary" />
            Modo visitante{minutos > 0 ? ` · ${minutos} min` : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/registar">Criar conta</Link></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-8 pb-32">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bem-vindo ao Papel</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Esta é a primeira página da plataforma. Em modo visitante podes simular o teu crédito —
            tudo fica apenas no teu dispositivo e é apagado ao fim de 2 horas.
          </p>
        </div>

        <SimuladorCredito persistGuest />

        <section>
          <h2 className="text-xl font-black tracking-tight">O que tens dentro da plataforma</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map(m => (
              <Card key={m.t} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <m.icon className="w-4 h-4 text-primary" /> {m.t}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.d}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" /> Requer conta
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-6xl mx-auto">
          <GuestCta minutesLeft={minutos} />
        </div>
      </div>
    </div>
  );
}
