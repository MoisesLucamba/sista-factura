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

function getStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: '' };
  if (pw.length < 6) return { level: 1, label: 'Fraca', color: 'bg-red-400' };
  if (pw.length < 10) return { level: 2, label: 'Razoável', color: 'bg-yellow-400' };
  return { level: 3, label: 'Forte', color: 'bg-green-500' };
}

export default function RedefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // valid recovery session
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('As palavras-passe não coincidem.'); return; }
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
    toast.success('Palavra-passe atualizada com sucesso!');
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const strength = getStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src={logoFaktura} alt="Faktura Angola" className="h-24 w-auto object-contain" />
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Senha atualizada!</h2>
              <p className="text-muted-foreground">A sua palavra-passe foi alterada com sucesso. A redirecionar...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Nova palavra-passe</h2>
              <p className="text-muted-foreground mt-1">Defina a sua nova palavra-passe</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-5">
              {error && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Nova palavra-passe</Label>
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
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmar palavra-passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={`h-11 text-sm border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary bg-gray-50/50 transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus-visible:border-red-400'
                        : 'border-gray-200'
                    }`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500">As palavras-passe não coincidem</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> A atualizar...</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Atualizar palavra-passe</>
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}