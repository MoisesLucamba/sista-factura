import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, AlertCircle, ArrowRight, Eye, EyeOff,
  Gauge, ShieldCheck, Banknote,
} from 'lucide-react';
import logoPapel from '@/assets/faktura-logo.png';
import heroBusiness from '@/assets/hero-business.jpg';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (user) navigate(from || '/dashboard', { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (identifier.trim().length < 6) { setError('Indica o teu email ou número de telefone.'); return; }
    if (password.length < 6) { setError('A palavra-passe tem pelo menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      let email = identifier.trim().toLowerCase();
      if (!email.includes('@')) {
        const { data, error: fnError } = await supabase.functions.invoke('resolve-login', {
          body: { identifier: email },
        });
        if (fnError || !data?.email) {
          setError(data?.error || 'Não encontrámos nenhuma conta com esses dados.');
          setLoading(false);
          return;
        }
        email = data.email;
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) setError('Dados incorrectos. Tenta novamente.');
    } catch {
      setError('Erro de ligação. Tenta novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBusiness} alt="Empresários angolanos" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.88) 100%)',
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/"><img src={logoPapel} alt="Papel" className="h-16 object-contain" /></Link>
          <div>
            <h2 className="text-white font-black leading-[0.95] mb-4" style={{ fontSize: 'clamp(2.2rem,3.6vw,3.4rem)' }}>
              Capital de giro<br />
              <span className="text-primary">para a tua empresa.</span>
            </h2>
            <p className="text-white/70 max-w-sm mb-8">
              Baseado no teu histórico real de faturação. Sem papelada, sem meses de espera.
            </p>
            <div className="flex flex-col gap-2.5 max-w-sm">
              {[
                { icon: ShieldCheck, label: 'Envias o SAF-T que já geras' },
                { icon: Gauge, label: 'Analisamos e calculamos o teu score' },
                { icon: Banknote, label: 'Recebes uma proposta de crédito' },
              ].map(({ icon: I, label }) => (
                <div key={label} className="rounded-xl px-4 py-3 flex items-center gap-3"
                     style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
                  <I className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-white/85 text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">Papel · Faktura Angola · NIF 5002964031</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoPapel} alt="Papel" className="h-20 object-contain" /></Link>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2">Entrar no Papel</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Usa o teu email ou número de telefone.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email ou telefone</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="nome@empresa.ao ou +244 9XX XXX XXX"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link to="/recuperar-senha" className="text-xs text-primary font-bold hover:underline">
                  Esqueceste-te?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Entrar
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Ainda não tens conta?{' '}
            <Link to="/registar" className="text-primary font-bold hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
