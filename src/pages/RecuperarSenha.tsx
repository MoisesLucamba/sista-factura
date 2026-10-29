import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail, Shield, Lock,
} from 'lucide-react';
import logoGiroDark from '@/assets/giro-logo-dark.svg';
import logoGiroLight from '@/assets/giro-logo-light.svg';
import heroBusiness from '@/assets/hero-business.jpg';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Painel lateral */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col overflow-hidden">
        <img src={heroBusiness} alt="Empresários angolanos" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,.8) 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/"><img src={logoGiroDark} alt="Giro" className="h-14 object-contain" /></Link>
          <div>
            <h2 className="text-white font-bold leading-[1.05] tracking-tight mb-4" style={{ fontSize: 'clamp(2.2rem,3.4vw,3.2rem)' }}>
              Recupera o<br />
              <span className="text-primary">teu acesso.</span>
            </h2>
            <p className="text-white/75 max-w-sm mb-8 leading-relaxed">
              Enviamos um link seguro para o teu email para redefinires a palavra-passe em segundos.
            </p>
            <ul className="space-y-3 max-w-sm">
              {[
                { icon: Mail, label: 'Link enviado para o teu email' },
                { icon: Shield, label: 'Ligação segura e encriptada' },
                { icon: Lock, label: 'Válido por 60 minutos' },
              ].map(({ icon: I, label }) => (
                <li key={label} className="flex items-center gap-3 text-white/85 text-sm">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <I className="w-4 h-4 text-primary" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-white/50 text-xs">Giro · Faktura Angola · NIF 5002964031</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoGiroLight} alt="Giro" className="h-16 object-contain" /></Link>
          </div>

          {success ? (
            <div key="ok" className="text-center animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Email enviado</h1>
              <p className="text-muted-foreground leading-relaxed">
                Enviámos o link de recuperação para{' '}
                <strong className="text-foreground">{email}</strong>.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-8">
                Verifica a caixa de entrada e clica no link para redefinires a palavra-passe.
                É válido por 60 minutos.
              </p>
              <Button asChild className="w-full h-12 text-base font-semibold">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Recuperar palavra-passe</h1>
              <p className="text-muted-foreground mb-8">
                Indica o email associado à tua conta.
              </p>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nome@empresa.ao"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="h-11 rounded-lg"
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A enviar…</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" /> Enviar link de recuperação</>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Lembraste-te da palavra-passe?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar à página inicial
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}