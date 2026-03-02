import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Save, Loader2, Key, CheckCircle2, Lock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Perfil() {
  const { profile, role, user } = useAuth();
  const [nome, setNome] = useState(profile?.nome || '');
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    operador: 'Operador',
    contador: 'Contador',
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Erro ao alterar senha: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  };

  const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'];
  const strength = passwordStrength();
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-2">

        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/90 to-primary border border-primary/20 p-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center gap-5">
            <div className="ring-4 ring-white/20 rounded-full shadow-xl">
              <Avatar className="w-[72px] h-[72px]">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {profile ? getInitials(profile.nome) : 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-tight font-display">
                {profile?.nome || 'Utilizador'}
              </h1>
              <p className="text-primary-foreground/60 text-sm mt-0.5 font-mono">
                {profile?.email}
              </p>
              {role && (
                <Badge className="mt-2 bg-white/15 text-white border-white/25 hover:bg-white/20 text-xs font-semibold gap-1">
                  <Shield className="w-3 h-3" />
                  {roleLabels[role] || role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Informações Pessoais</p>
              <p className="text-xs text-muted-foreground">Atualize os seus dados de perfil</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3" /> Nome Completo
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O seu nome completo"
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="rounded-xl h-10 bg-muted text-muted-foreground font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="pt-1">
              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-xl h-9 px-5 font-semibold">
                {saving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> A guardar...</>
                  : <><Save className="w-3.5 h-3.5" /> Guardar alterações</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Segurança</p>
              <p className="text-xs text-muted-foreground">Atualize a sua palavra-passe</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Nova Senha
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-10"
              />
              {newPassword && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength
                            ? strength >= 4 ? 'hsl(var(--primary))' : strength === 3 ? '#f59e0b' : '#ef4444'
                            : 'hsl(var(--muted))',
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-xs font-medium"
                    style={{
                      color: strength >= 4 ? 'hsl(var(--primary))' : strength === 3 ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirmar Nova Senha
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-10"
                style={{
                  borderColor: passwordsMatch
                    ? 'hsl(var(--primary))'
                    : passwordsMismatch ? '#ef4444' : undefined,
                }}
              />
              {passwordsMatch && (
                <p className="text-xs flex items-center gap-1 font-medium text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Senhas coincidem
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs flex items-center gap-1 font-medium text-destructive">
                  <XCircle className="w-3.5 h-3.5" /> Senhas não coincidem
                </p>
              )}
            </div>

            <div className="pt-1">
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="gap-2 rounded-xl h-9 px-5 font-semibold"
              >
                {changingPassword
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> A alterar...</>
                  : <><Key className="w-3.5 h-3.5" /> Alterar senha</>
                }
              </Button>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}