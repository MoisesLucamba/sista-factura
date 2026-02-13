import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';

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

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-accent overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(45 100% 51% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(45 100% 51% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-accent-foreground w-full">
          <div>
            <img src={logoFaktura} alt="Faktura" className="h-24 w-auto object-contain" />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Recupere o
              <span className="block text-primary">seu acesso.</span>
            </h1>
            <p className="text-lg text-accent-foreground/70 max-w-md">
              Enviaremos um link seguro para o seu email para redefinir a palavra-passe.
            </p>
          </div>

          <p className="text-sm text-accent-foreground/40">
            © {new Date().getFullYear()} Faktura Angola
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden">
            <img src={logoFaktura} alt="Faktura Angola" className="h-24 w-auto object-contain" />
          </div>

          {success ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Email enviado!</h2>
                <p className="text-muted-foreground">
                  Enviámos um link de recuperação para <strong>{email}</strong>. Verifique a sua caixa de entrada.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full h-12 font-bold shadow-lg shadow-primary/25 mt-4">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Recuperar senha</h2>
                <p className="text-muted-foreground">
                  Introduza o email associado à sua conta
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
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Enviar link de recuperação
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Lembrou-se da senha?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Voltar ao Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
