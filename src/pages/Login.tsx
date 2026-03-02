import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou palavra-passe incorretos.' : error.message);
      setLoading(false);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-accent overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(45 100% 51% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(45 100% 51% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-accent-foreground w-full">
          <div>
            <img src={logoFaktura} alt="Faktura" className="h-24 w-auto object-contain" />
          </div>
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-4">
                Faturação
                <span className="block text-primary">simplificada.</span>
              </h1>
              <p className="text-lg text-accent-foreground/70 max-w-md">
                A plataforma de faturação mais moderna de Angola. Rápida, segura e em conformidade com a AGT.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Emissão de faturas em segundos' },
                { icon: Shield, text: 'Conformidade total com a AGT' },
                { icon: BarChart3, text: 'Relatórios em tempo real' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-accent-foreground/80 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-accent-foreground/40">© {new Date().getFullYear()} Faktura Angola</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden mb-8">
            <img src={logoFaktura} alt="Faktura Angola" className="h-24 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-1">Introduza as suas credenciais para continuar</p>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-5">
            {error && (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.ao"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-sm border border-gray-200 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary bg-gray-50/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Palavra-passe</Label>
                  <Link to="/recuperar-senha" className="text-xs text-primary font-semibold hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-sm border border-gray-200 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary bg-gray-50/50 transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all group"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A entrar...</>
                ) : (
                  <>Entrar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/registar" className="text-primary font-bold hover:underline">Criar conta grátis</Link>
            </p>
            <p className="text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                ← Voltar à página inicial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}