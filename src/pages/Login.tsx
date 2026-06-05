import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, ArrowRight, Zap, Shield, BarChart3,
  CheckCircle, FileText, BadgeDollarSign, Sparkles,
  Users, TrendingUp, Lock, Eye, EyeOff, X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoFaktura from '@/assets/faktura-logo.png';
import heroBusiness from '@/assets/hero-business.jpg';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 300;

export default function Login() {
  const [digits, setDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const passwordRef = useRef<HTMLInputElement>(null);
  const digitsRef = useRef<HTMLInputElement>(null);

  const { signIn, role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    if (user && role) {
      const target = role === 'comprador' ? '/comprador' : (from || '/dashboard');
      navigate(target, { replace: true });
    }
  }, [user, role, navigate, from]);

  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setLockUntil(null);
        setAttempts(0);
        setCountdown(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleDigitsChange = (value: string) => {
    const fullMatch = value.match(/FK-244-(\d{1,6})/i);
    if (fullMatch) {
      const extracted = fullMatch[1].slice(0, 6);
      setDigits(extracted);
      if (extracted.length === 6) setTimeout(() => passwordRef.current?.focus(), 50);
      return;
    }
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setDigits(cleaned);
    if (cleaned.length === 6) setTimeout(() => passwordRef.current?.focus(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (lockUntil && Date.now() < lockUntil) { setError(`Conta temporariamente bloqueada. Tenta novamente em ${countdown}s.`); return; }
    if (digits.length !== 6) { setError('O teu ID tem 6 dígitos'); return; }
    if (password.length < 6) { setError('O código de acesso tem pelo menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const fakturaId = `FK-244-${digits}`;
      const { data: resolveData, error: resolveError } = await supabase.functions.invoke('resolve-faktura-id', { body: { faktura_id: fakturaId } });
      if (resolveError || !resolveData?.email) {
        setError(resolveData?.error || 'ID não encontrado. Verifica os teus dígitos.');
        setAttempts(prev => { const next = prev + 1; if (next >= MAX_ATTEMPTS) setLockUntil(Date.now() + LOCKOUT_SECONDS * 1000); return next; });
        setLoading(false); return;
      }
      const { error: signInError } = await signIn(resolveData.email, password);
      if (signInError) {
        setError('Código incorreto. Tenta novamente.');
        setAttempts(prev => { const next = prev + 1; if (next >= MAX_ATTEMPTS) setLockUntil(Date.now() + LOCKOUT_SECONDS * 1000); return next; });
        setLoading(false); return;
      }
      setAttempts(0);
    } catch { setError('Erro de ligação. Tenta novamente.'); }
    setLoading(false);
  };

  const isLocked = lockUntil !== null && Date.now() < lockUntil;
  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      <style>{`
        @keyframes shimmer       { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float         { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-10px)} }
        @keyframes float2        { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes float3        { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-8px)} }
        @keyframes pulse-ring    { 0%{transform:scale(1);opacity:.45} 100%{transform:scale(1.9);opacity:0} }
        @keyframes glow-pulse    { 0%,100%{box-shadow:0 0 20px hsl(var(--primary)/.25)} 50%{box-shadow:0 0 50px hsl(var(--primary)/.55)} }
        @keyframes panel-slide-l { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panel-slide-r { from{opacity:0;transform:translateX(40px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fade-up       { from{opacity:0;transform:translateY(22px)}  to{opacity:1;transform:translateY(0)} }

        .reg-panel-l { animation: panel-slide-l .85s cubic-bezier(.22,1,.36,1) both; }
        .reg-panel-r { animation: panel-slide-r .85s cubic-bezier(.22,1,.36,1) .08s both; }
        .fu-1 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .20s both; }
        .fu-2 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .33s both; }
        .fu-3 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .46s both; }
        .fu-4 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .59s both; }
        .fu-5 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .72s both; }
        .fu-6 { animation: fade-up .6s cubic-bezier(.4,0,.2,1) .85s both; }

        .af  { animation: float  4s ease-in-out infinite; }
        .af2 { animation: float2 5.5s ease-in-out infinite; }
        .af3 { animation: float3 3.5s ease-in-out 1s infinite; }
        .ag  { animation: glow-pulse 3s ease-in-out infinite; }

        .auth-photo { position:absolute; inset:0; overflow:hidden; }
        .auth-photo img { width:100%; height:100%; object-fit:cover; object-position:center 30%; }
        .auth-photo::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(180deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.18) 35%, rgba(0,0,0,.38) 65%, rgba(0,0,0,.84) 100%),
                      linear-gradient(90deg, rgba(0,0,0,.52) 0%, transparent 58%);
        }
        .glass-pill { background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.20); backdrop-filter:blur(14px); }
        .glass-stat { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); backdrop-filter:blur(18px); transition:all .3s ease; }
        .glass-stat:hover { background:rgba(255,255,255,.13); transform:translateY(-3px); }
        .float-badge { background:rgba(255,255,255,.95); backdrop-filter:blur(20px); box-shadow:0 8px 32px rgba(0,0,0,.18); }
        .dark .float-badge { background:rgba(18,18,26,.96); }
        .pulse-ring::before { content:''; position:absolute; inset:-6px; border-radius:inherit; border:2px solid hsl(var(--primary)/.4); animation:pulse-ring 2s ease-out infinite; }
        .auth-grid { position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.035; background-image: linear-gradient(rgba(255,255,255,1) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px); background-size:80px 80px; }
        .shimmer-text { background:linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .shimmer-white { background:linear-gradient(90deg,hsl(var(--primary)) 0%,#fff 45%,hsl(var(--primary)) 90%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 20px hsl(var(--primary)/.4)); animation:shimmer 3s linear infinite; }
        .auth-input { height:2.75rem; border-radius:.75rem; border:2px solid hsl(var(--border)/.7); background:hsl(var(--muted)/.4); font-size:.875rem; padding:0 1rem; transition:border-color .25s,box-shadow .25s,background .25s; width:100%; }
        .auth-input:hover { border-color:hsl(var(--border)); }
        .auth-input:focus { border-color:hsl(var(--primary)/.55) !important; box-shadow:0 0 0 3px hsl(var(--primary)/.12) !important; background:hsl(var(--background)) !important; outline:none; }
        .btn-glow:hover { box-shadow:0 8px 32px hsl(var(--primary)/.45) !important; }
        .auth-divider { display:flex; align-items:center; gap:10px; }
        .auth-divider::before,.auth-divider::after { content:''; flex:1; height:1px; background:hsl(var(--border)); }
      `}</style>

      {/* Left Panel — Hero */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative flex-col reg-panel-l overflow-hidden">
        <div className="auth-photo"><img src={heroBusiness} alt="Empresarios angolanos com Faktura" /></div>
        <div className="auth-grid" />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:520,height:520,background:'hsl(var(--primary)/.26)',filter:'blur(115px)',top:'8%',left:'-6%' }} />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:300,height:300,background:'hsl(var(--primary)/.15)',filter:'blur(80px)',bottom:'12%',right:'8%' }} />
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          <Link to="/" className="self-start"><img src={logoFaktura} alt="Faktura Angola" className="h-20 object-contain" /></Link>
          <div className="my-auto">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-2 mb-7 cursor-default">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">Plataforma #1 de faturação em Angola</span>
            </div>
            <h2 className="font-black text-white mb-4 leading-[.88]" style={{ fontSize:'clamp(2.4rem,4.5vw,4.5rem)',letterSpacing:'-0.025em' }}>
              Faturação<br /><span className="shimmer-white">simplificada.</span>
            </h2>
            <p className="text-white/65 max-w-xs leading-relaxed mb-9 font-medium" style={{ fontSize:'clamp(.9rem,1.1vw,1.05rem)' }}>
              Rápida, segura e em conformidade total com a AGT. Tudo num só lugar.
            </p>
            <div className="flex flex-col gap-2.5">
              {[{icon:Zap,label:'Emissão de faturas em segundos'},{icon:Shield,label:'Conformidade total com a AGT'},{icon:BarChart3,label:'Relatórios e métricas em tempo real'}].map(({icon:I,label},idx) => (
                <div key={idx} className="glass-stat rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center flex-shrink-0"><I className="w-4 h-4 text-white" /></div>
                  <span className="text-white/80 text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[{icon:Users,v:'500+',l:'Empresas'},{icon:FileText,v:'50.000+',l:'Faturas'},{icon:TrendingUp,v:'99%',l:'Uptime'}].map(({icon:I,v,l},idx) => (
              <div key={idx} className="glass-stat rounded-xl px-3 py-2 flex items-center gap-2 cursor-default">
                <I className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                <span className="text-white font-black text-sm tabular-nums">{v}</span>
                <span className="text-white/45 text-xs font-semibold">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="af2 absolute right-8 top-[28%] z-20 float-badge rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
          <div className="relative pulse-ring w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-tight">Conformidade AGT</p>
            <p className="text-xs text-muted-foreground">100% certificado</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 reg-panel-r overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoFaktura} alt="Faktura" className="h-24 object-contain" /></Link>
          </div>

          {/* Header */}
          <div className="fu-1 mb-5">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold">Bem-vindo de volta</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">
              Entre na <span className="shimmer-text">Faktura</span>
            </h1>
            <p className="text-muted-foreground text-sm">Acede à tua conta com o teu ID pessoal</p>
          </div>

          {/* Error / Lock */}
          {error && (
            <div className="fu-2 mb-4">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {isLocked && (
            <div className="fu-2 mb-4">
              <Alert className="border-amber-500/30 bg-amber-500/5 rounded-xl">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-700">
                  Conta bloqueada. Tenta em <strong>{formatCountdown(countdown)}</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Faktura ID */}
            <div className="fu-2 space-y-1.5">
              <label className="text-sm font-bold flex items-center justify-between">
                <span>O teu ID Faktura</span>
              </label>
              <div className={`flex items-center h-[2.75rem] rounded-xl overflow-hidden border-2 transition-all ${focused === 'digits' ? 'border-primary/55 bg-background shadow-[0_0_0_3px_hsl(var(--primary)/.12)]' : 'border-border/70 bg-muted/40'}`}>
                <div className="flex items-center justify-center px-3 h-full bg-primary/10 border-r-2 border-border/70 text-xs font-bold text-primary/85 whitespace-nowrap select-none">
                  FK · 244
                </div>
                <input
                  ref={digitsRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={15}
                  value={digits}
                  onChange={e => handleDigitsChange(e.target.value)}
                  onFocus={() => setFocused('digits')}
                  onBlur={() => setFocused(null)}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData('text');
                    const match = pasted.match(/FK-244-(\d{1,6})/i);
                    if (match) { e.preventDefault(); handleDigitsChange(pasted); }
                  }}
                  disabled={loading || isLocked}
                  placeholder="_ _ _ _ _ _"
                  className="flex-1 h-full px-3 bg-transparent border-none outline-none text-sm font-mono font-bold tracking-[0.25em] text-foreground placeholder:text-muted-foreground/30"
                  autoComplete="off"
                />
                {digits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setDigits(''); digitsRef.current?.focus(); }}
                    className="px-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {digits.length > 0 && (
                <p className="text-[11px] text-muted-foreground font-mono px-1">FK-244-{digits.padEnd(6, '_')}</p>
              )}
            </div>

            {/* Password */}
            <div className="fu-3 space-y-1.5">
              <label className="text-sm font-bold flex items-center justify-between">
                <span>Código de acesso</span>
                <Link to="/recuperar-senha" className="text-xs text-primary font-bold hover:underline">Esqueceste o código?</Link>
              </label>
              <div className={`flex items-center h-[2.75rem] rounded-xl overflow-hidden border-2 transition-all ${focused === 'password' ? 'border-primary/55 bg-background shadow-[0_0_0_3px_hsl(var(--primary)/.12)]' : 'border-border/70 bg-muted/40'}`}>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  disabled={loading || isLocked}
                  className="flex-1 h-full px-3 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/30"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="fu-4 pt-1">
              <Button type="submit" disabled={loading || isLocked}
                className="w-full h-12 text-base font-black rounded-xl shadow-lg shadow-primary/25 btn-glow ag hover:scale-[1.02] transition-all group gap-2">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> A entrar...</>
                ) : (
                  <>ENTRAR <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          {/* Recovery divider */}
          <div className="fu-5 mt-5 mb-4">
            <div className="auth-divider">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 whitespace-nowrap">Recuperar acesso</span>
            </div>
          </div>

          {/* Recovery links */}
          <div className="fu-5 grid grid-cols-2 gap-3 mb-4">
            <Link to="/recuperar-id">
              <Button variant="outline" className="w-full h-11 text-xs font-bold rounded-xl border-2 hover:bg-primary/5 hover:border-primary/40 transition-all gap-1.5">
                <BadgeDollarSign className="w-3.5 h-3.5" /> Reenviar ID
              </Button>
            </Link>
            <Link to="/recuperar-senha">
              <Button variant="outline" className="w-full h-11 text-xs font-bold rounded-xl border-2 hover:bg-primary/5 hover:border-primary/40 transition-all gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Nova senha
              </Button>
            </Link>
          </div>

          {/* Register link */}
          <div className="fu-5 mt-4 mb-4">
            <div className="auth-divider">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 whitespace-nowrap">Ainda não tens ID?</span>
            </div>
          </div>

          <div className="fu-6">
            <Link to="/registar">
              <Button variant="outline" className="w-full h-12 text-sm font-bold rounded-xl border-2 hover:bg-primary/5 hover:border-primary/40 hover:scale-[1.02] transition-all gap-2">
                Criar Faktura ID <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium group">
              <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Voltar à página inicial
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
            <Lock className="w-3.5 h-3.5" />
            <span>Ligação segura · Dados encriptados TLS/SSL</span>
          </div>

          <div className="mt-2 text-center">
            <p className="text-[11px] text-muted-foreground/40 italic">Sem a Faktura, não fakturo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
