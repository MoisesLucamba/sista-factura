import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logoFaktura from '@/assets/logo-faktura.png';

export default function PendingApproval() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('checking');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    checkStatus();
  }, [user]);

  const checkStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('approval_status, rejection_reason, tipo')
      .eq('user_id', user.id)
      .single();

    if (!data) return;
    if (data.approval_status === 'approved') {
      navigate(data.tipo === 'comprador' ? '/comprador' : '/dashboard');
      return;
    }
    setStatus(data.approval_status || 'pending');
    setRejectionReason(data.rejection_reason);
  };

  const triggerVerification = async () => {
    if (!user) return;
    setVerifying(true);
    setStatus('verifying');
    try {
      const profileData = await supabase.from('profiles').select('tipo').eq('user_id', user.id).single();
      const dest = profileData.data?.tipo === 'comprador' ? '/comprador' : '/dashboard';
      const { data, error } = await supabase.functions.invoke('verify-buyer-id', {
        body: { user_id: user.id },
      });

      if (error) throw error;

      if (data.status === 'approved') {
        toast.success('Verificação concluída! A sua conta foi aprovada.');
        setStatus('approved');
        setTimeout(() => navigate(dest), 2000);
      } else if (data.status === 'rejected') {
        setStatus('rejected');
        setRejectionReason(data.reason);
        toast.error('Verificação falhou. O número de identificação não corresponde.');
      } else if (data.status === 'pending_manual') {
        setStatus('pending');
        toast.info('A verificação automática não foi possível. Um administrador irá verificar manualmente.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error('Erro ao verificar. Tente novamente.');
      setStatus('pending');
    } finally {
      setVerifying(false);
    }
  };

  // Auto-trigger verification on first load if pending
  useEffect(() => {
    if (status === 'pending' && !verifying) {
      triggerVerification();
    }
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <style>{`
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>

      <div className="w-full max-w-md text-center">
        <img src={logoFaktura} alt="Faktura" className="h-10 mx-auto mb-8 object-contain" />

        {(status === 'checking' || status === 'verifying') && (
          <>
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">
              {status === 'checking' ? 'A carregar...' : 'A verificar o seu documento...'}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              A nossa inteligência artificial está a analisar o seu documento de identificação
              e a comparar com o NIF informado. Isto pode demorar alguns segundos.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>Verificação automática por IA</span>
            </div>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="mx-auto w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3 text-green-600">
              Conta Aprovada!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              O seu documento foi verificado com sucesso. A redirecionar para o seu dashboard...
            </p>
            <Button onClick={() => navigate('/comprador')} className="gap-2">
              Ir para o Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="mx-auto w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3 text-destructive">
              Verificação Falhou
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3 max-w-sm mx-auto">
              {rejectionReason || 'O número de identificação informado não corresponde ao documento enviado.'}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Por favor, registe-se novamente com os dados correctos ou entre em contacto com o suporte.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => navigate('/registar')} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Registar novamente
              </Button>
              <Button variant="ghost" onClick={signOut} className="text-muted-foreground text-sm">
                Terminar sessão
              </Button>
            </div>
          </>
        )}

        {status === 'pending' && !verifying && (
          <>
            <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-amber-500 pulse-slow" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">
              Aprovação Pendente
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              A verificação automática não foi possível. Um administrador irá analisar
              o seu documento manualmente. Receberá uma notificação quando a sua conta for aprovada.
            </p>
            <Button variant="ghost" onClick={signOut} className="text-muted-foreground text-sm">
              Terminar sessão
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
