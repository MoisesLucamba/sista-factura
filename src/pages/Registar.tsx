import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import logoFaktura from '@/assets/logo-faktura.png';

export default function Registar() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, nome);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está registado.');
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Conta Criada!</CardTitle>
            <CardDescription>
              Enviámos um email de confirmação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Verifique a sua caixa de entrada e clique no link de confirmação para ativar a sua conta.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/login')} className="w-full h-12 font-bold shadow-lg shadow-primary/25">
              Ir para Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-accent overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
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
                Comece a faturar
                <span className="block text-primary">hoje mesmo.</span>
              </h1>
              <p className="text-lg text-accent-foreground/70 max-w-md">
                Junte-se a centenas de empresas angolanas que já confiam no Faktura.
              </p>
            </div>

            <div className="bg-accent-foreground/5 backdrop-blur-sm rounded-2xl p-6 border border-accent-foreground/10">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-accent-foreground/80 italic mb-3">
                "O Faktura transformou completamente a nossa gestão de faturas. Simples, rápido e em conformidade."
              </p>
              <p className="text-sm text-accent-foreground/50 font-medium">— João Silva, CEO da TechAngola</p>
            </div>
          </div>

          <p className="text-sm text-accent-foreground/40">
            © {new Date().getFullYear()} Faktura Angola
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-center lg:hidden">
            <img src={logoFaktura} alt="Faktura Angola" className="h-24 w-auto object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Criar conta</h2>
            <p className="text-muted-foreground">
              Registe-se gratuitamente e comece agora
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-semibold">Nome Completo</Label>
              <Input
                id="nome" type="text" placeholder="António Manuel"
                value={nome} onChange={(e) => setNome(e.target.value)}
                required disabled={loading}
                className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email" type="email" placeholder="seu@email.ao"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={loading}
                className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Palavra-passe</Label>
                <Input
                  id="password" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required disabled={loading}
                  className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmar</Label>
                <Input
                  id="confirmPassword" type="password" placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required disabled={loading}
                  className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              O primeiro utilizador a registar-se terá permissões de administrador.
            </p>

            <Button 
              type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />A criar conta...</>
              ) : (
                <>Criar Conta Grátis<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
