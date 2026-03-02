import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';
import { toast } from 'sonner';

export default function RedefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via recovery link - good to proceed
      }
    });
  }, []);

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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    toast.success('Palavra-passe atualizada com sucesso!');
    
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center">
          <img src={logoFaktura} alt="Faktura Angola" className="h-24 w-auto object-contain" />
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Senha atualizada!</h2>
              <p className="text-muted-foreground">
                A sua palavra-passe foi alterada com sucesso. A redirecionar...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Nova palavra-passe</h2>
              <p className="text-muted-foreground">
                Defina a sua nova palavra-passe
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
                <Label htmlFor="password" className="text-sm font-semibold">Nova palavra-passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 text-base border-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmar palavra-passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    A atualizar...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Atualizar palavra-passe
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
