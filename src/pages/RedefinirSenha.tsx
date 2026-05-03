import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, CheckCircle2, Lock, ArrowRight,
  Shield, Sparkles, FileText, BadgeDollarSign, CheckCircle,
  Users, TrendingUp,
} from 'lucide-react';
import logoFaktura from '@/assets/faktura-logo.svg';
import heroBusiness from '@/assets/hero-business.jpg';
import { toast } from 'sonner';

function getStrength(pw: string): { level: number; label: string; bars: string[] } {
  if (pw.length === 0) return { level: 0, label: '', bars: [] };
  if (pw.length < 6)   return { level: 1, label: 'Fraca — mínimo 6 caracteres',    bars: ['#ef4444','hsl(var(--border))','hsl(var(--border))','hsl(var(--border))'] };
  if (pw.length < 8)   return { level: 2, label: 'Razoável — tente mais caracteres', bars: ['#f59e0b','#f59e0b','hsl(var(--border))','hsl(var(--border))'] };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
    return { level: 4, label: 'Muito forte ✓', bars: ['hsl(var(--primary))','hsl(var(--primary))','hsl(var(--primary))','hsl(var(--primary))'] };
  return { level: 3, label: 'Boa — adicione maiúsculas e números', bars: ['#3b82f6','#3b82f6','#3b82f6','hsl(var(--border))'] };
}

export default function RedefinirSenha() {
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [success, setSuccess]               = useState(false);
  const [loading, setLoading]               = useState(false);
  const [focused, setFocused]               = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { /* valid session */ }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('As palavras-passe não coincidem.'); return; }
    if (password.length < 6)          { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
    toast.success('Palavra-passe atualizada com sucesso!');
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const strength = getStrength(password);
  const pwMatch  = confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">

      {/* ══ ESTILOS — idênticos a toda a suite auth ══ */}
      <style>{`
        @keyframes shimmer       { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float         { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-10px)} }
        @keyframes float2        { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes float3        { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-8px)} }
        @keyframes pulse-ring    { 0%{transform:scale(1);opacity:.45} 100%{transform:scale(1.9);opacity:0} }
        @keyframes glow-pulse    { 0%,100%{box-shadow:0 0 20px hsl(var(--primary)/.25)} 50%{box-shadow:0 0 50px hsl(var(--primary)/.55),0 0 90px hsl(var(--primary)/.15)} }
        @keyframes panel-slide-l { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panel-slide-r { from{opacity:0;transform:translateX(40px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fade-up       { from{opacity:0;transform:translateY(22px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes scale-in      { from{opacity:0;transform:scale(.8)}         to{opacity:1;transform:scale(1)} }

        .red-panel-l { animation: panel-slide-l .85s cubic-bezier(.22,1,.36,1) both; }
        .red-panel-r { animation: panel-slide-r .85s cubic-bezier(.22,1,.36,1) .08s both; }
        .fu-1 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .20s both; }
        .fu-2 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .35s both; }
        .fu-3 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .50s both; }
        .fu-4 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .65s both; }
        .fu-5 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .80s both; }
        .success-icon { animation: scale-in .6s cubic-bezier(.34,1.56,.64,1) both; }

        .af  { animation: float  4s ease-in-out infinite; }
        .af2 { animation: float2 5.5s ease-in-out infinite; }
        .af3 { animation: float3 3.5s ease-in-out 1s infinite; }
        .ag  { animation: glow-pulse 3s ease-in-out infinite; }

        .auth-photo { position:absolute; inset:0; overflow:hidden; }
        .auth-photo img { width:100%; height:100%; object-fit:cover; object-position:center 30%; }
        .auth-photo::after {
          content:''; position:absolute; inset:0;
          background:
            linear-gradient(180deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,.18) 35%,rgba(0,0,0,.38) 65%,rgba(0,0,0,.84) 100%),
            linear-gradient(90deg,rgba(0,0,0,.52) 0%,transparent 58%);
        }
        .glass-pill  { background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.20); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); }
        .glass-stat  { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); transition:all .3s ease; }
        .glass-stat:hover { background:rgba(255,255,255,.13); transform:translateY(-3px); }
        .float-badge { background:rgba(255,255,255,.95); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); box-shadow:0 8px 32px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08); }
        .dark .float-badge { background:rgba(18,18,26,.96); }
        .pulse-ring::before { content:''; position:absolute; inset:-6px; border-radius:inherit; border:2px solid hsl(var(--primary)/.4); animation:pulse-ring 2s ease-out infinite; }
        .auth-grid { position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.035; background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px); background-size:80px 80px; }
        .shimmer-text  { background:linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .shimmer-white { background:linear-gradient(90deg,hsl(var(--primary)) 0%,#fff 45%,hsl(var(--primary)) 90%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 20px hsl(var(--primary)/.4)); animation:shimmer 3s linear infinite; }
        .auth-input { height:3rem; border-radius:.75rem; border:2px solid hsl(var(--border)/.7); background:hsl(var(--muted)/.4); font-size:.875rem; padding:0 1rem; transition:border-color .25s,box-shadow .25s,background .25s; width:100%; }
        .auth-input:hover { border-color:hsl(var(--border)); }
        .auth-input:focus { border-color:hsl(var(--primary)/.55) !important; box-shadow:0 0 0 3px hsl(var(--primary)/.12) !important; background:hsl(var(--background)) !important; outline:none; }
        .auth-input-error { border-color:#ef4444 !important; }
        .auth-input-error:focus { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.12) !important; }
        .btn-glow:hover { box-shadow:0 8px 32px hsl(var(--primary)/.45) !important; }
        .glow-ring { box-shadow:0 0 0 6px hsl(var(--primary)/.12),0 0 40px hsl(var(--primary)/.25); }
      `}</style>

      {/* ══ PAINEL ESQUERDO ══ */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col red-panel-l overflow-hidden">
        <div className="auth-photo"><img src={heroBusiness} alt="Faktura" /></div>
        <div className="auth-grid" />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:520,height:520,background:'hsl(var(--primary)/.26)',filter:'blur(115px)',top:'8%',left:'-6%' }} />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:300,height:300,background:'hsl(var(--primary)/.15)',filter:'blur(80px)',bottom:'12%',right:'8%' }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          <Link to="/" className="self-start">
            <img src={logoFaktura} alt="Faktura Angola" className="h-9 object-contain" />
          </Link>

          <div className="my-auto">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-2 mb-7 cursor-default">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">Segurança da sua conta</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            </div>

            <h2 className="font-black text-white mb-4 leading-[.88]"
              style={{ fontSize:'clamp(2.4rem,4.5vw,4.5rem)',letterSpacing:'-0.025em' }}>
              Nova<br />
              <span className="shimmer-white">palavra-passe.</span>
            </h2>

            <p className="text-white/65 max-w-xs leading-relaxed mb-9 font-medium"
              style={{ fontSize:'clamp(.9rem,1.1vw,1.05rem)' }}>
              Defina uma nova palavra-passe forte para proteger a sua conta Faktura.
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                { icon:Lock,   label:'Mínimo 6 caracteres'               },
                { icon:Shield, label:'Recomendamos maiúsculas e números'  },
                { icon:CheckCircle, label:'Confirmação em tempo real'     },
              ].map(({ icon:I, label }, idx) => (
                <div key={idx} className="glass-stat rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center flex-shrink-0">
                    <I className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {[
              { icon:Users,      v:'500+',    l:'Empresas'  },
              { icon:FileText,   v:'50.000+', l:'Faturas'   },
              { icon:TrendingUp, v:'99%',     l:'Uptime'    },
            ].map(({ icon:I, v, l }, idx) => (
              <div key={idx} className="glass-stat rounded-xl px-3 py-2 flex items-center gap-2 cursor-default">
                <I className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                <span className="text-white font-black text-sm tabular-nums">{v}</span>
                <span className="text-white/45 text-xs font-semibold">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badges */}
        <div className="af2 absolute right-8 top-[30%] z-20 float-badge rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
          <div className="relative pulse-ring w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-tight">Conformidade AGT</p>
            <p className="text-xs text-muted-foreground">100% certificado</p>
          </div>
        </div>
        <div className="af3 absolute right-28 top-[52%] z-20 float-badge rounded-xl px-3 py-2.5 flex items-center gap-3 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">FT 2025/1284</p>
            <p className="text-[11px] text-primary font-semibold">✓ Enviada via WhatsApp</p>
          </div>
        </div>
        <div className="af absolute right-10 bottom-[28%] z-20 float-badge rounded-xl px-3 py-2.5 flex items-center gap-3 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <BadgeDollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">+50 Kz creditados</p>
            <p className="text-[11px] text-muted-foreground">ID M20XV · agora mesmo</p>
          </div>
        </div>
      </div>

      {/* ══ PAINEL DIREITO ══ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 red-panel-r overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoFaktura} alt="Faktura Angola" className="h-10 object-contain" /></Link>
          </div>

          {success ? (
            /* ── Estado de sucesso ── */
            <div className="text-center">
              <div className="success-icon mx-auto w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-6 glow-ring">
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="fu-1 text-3xl font-black tracking-tight leading-tight mb-2">
                Senha <span className="shimmer-text">atualizada!</span>
              </h2>
              <p className="fu-2 text-muted-foreground text-sm mb-8 leading-relaxed">
                A sua palavra-passe foi alterada com sucesso. A redirecionar para o dashboard...
              </p>
              <div className="fu-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A redirecionar...</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Formulário ── */
            <>
              <div className="fu-1 mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4 cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold">Redefinir palavra-passe</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">
                  Nova <span className="shimmer-text">palavra-passe</span>
                </h1>
                <p className="text-muted-foreground text-sm">Defina uma nova palavra-passe segura</p>
              </div>

              {error && (
                <div className="fu-2 mb-5">
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nova senha */}
                <div className="fu-2 space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-bold">Nova palavra-passe</Label>
                  <Input
                    id="password" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    required disabled={loading}
                    className={`auth-input ${focused==='password' ? 'border-primary/55 !bg-background shadow-[0_0_0_3px_hsl(var(--primary)/.12)]' : ''}`}
                  />
                  {/* Barra de força */}
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {strength.bars.map((color, i) => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: color }} />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div className="fu-3 space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold">Confirmar palavra-passe</Label>
                  <Input
                    id="confirmPassword" type="password" placeholder="••••••••"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                    required disabled={loading}
                    className={`auth-input ${
                      pwMatch
                        ? 'auth-input-error border-red-400'
                        : focused==='confirmPassword'
                          ? 'border-primary/55 !bg-background shadow-[0_0_0_3px_hsl(var(--primary)/.12)]'
                          : ''
                    }`}
                  />
                  {pwMatch && (
                    <p className="text-[11px] text-red-500">As palavras-passe não coincidem</p>
                  )}
                  {confirmPassword.length > 0 && !pwMatch && (
                    <p className="text-[11px] text-primary font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Coincidem ✓
                    </p>
                  )}
                </div>

                {/* Botão */}
                <div className="fu-4 pt-1">
                  <Button type="submit" disabled={loading}
                    className="w-full h-12 text-base font-black rounded-xl shadow-lg shadow-primary/25 btn-glow ag hover:scale-[1.02] transition-all group gap-2">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> A atualizar...</>
                    ) : (
                      <><Lock className="h-4 w-4" /> Atualizar palavra-passe</>
                    )}
                  </Button>
                </div>
              </form>

              <div className="fu-5 mt-5 text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium group">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Voltar ao Login
                </Link>
              </div>

              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                <Lock className="w-3.5 h-3.5" />
                <span>Ligação segura · Dados encriptados TLS/SSL</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}