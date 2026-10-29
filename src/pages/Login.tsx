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
import logoGiroDark from '@/assets/giro-logo-dark.svg';
import logoGiroLight from '@/assets/giro-logo-light.svg';
import heroBusiness from '@/assets/hero-business.jpg';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (!user) return;
    const destino = from || (role === 'banco' ? '/banco' : '/dashboard');
    navigate(destino, { replace: true });
  }, [user, role, navigate, from]);

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
              Capital de giro<br />
              <span className="text-primary">para a tua empresa.</span>
            </h2>
            <p className="text-white/75 max-w-sm mb-8 leading-relaxed">
              Baseado no teu histórico real de faturação. Sem papelada, sem meses de espera.
            </p>
            <ul className="space-y-3 max-w-sm">
              {[
                { icon: ShieldCheck, label: 'Envias o SAF-T que já geras' },
                { icon: Gauge, label: 'Analisamos e calculamos o teu score' },
                { icon: Banknote, label: 'Recebes uma proposta de crédito' },
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

          <h1 className="text-3xl font-bold tracking-tight mb-2">Entrar no Giro</h1>
          <p className="text-muted-foreground mb-8">Usa o teu email ou número de telefone.</p>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-sm font-medium">Email ou telefone</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="nome@empresa.ao ou +244 9XX XXX XXX"
                autoComplete="username"
                disabled={loading}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Palavra-passe</Label>
                <Link to="/recuperar-senha" className="text-xs text-primary font-medium hover:underline">
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
                  className="h-11 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-8">
            Ainda não tens conta?{' '}
            <Link to="/registar" className="text-primary font-semibold hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}