import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, ArrowRight, Zap, Shield, BarChart3,
  CheckCircle, CheckCircle2, FileText, BadgeDollarSign,
  Sparkles, Users, TrendingUp, Lock, Star, ShoppingBag, Store,
  Camera, ShieldCheck,
} from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';
import heroBusiness from '@/assets/hero-business.jpg';

type UserTipo = 'vendedor' | 'comprador';
type SellerSubtype = 'pessoal' | 'empresa';

export default function Registar() {
  const [tipo, setTipo] = useState<UserTipo>('vendedor');
  const [sellerSubtype, setSellerSubtype] = useState<SellerSubtype>('pessoal');
  const [nome, setNome] = useState('');
  const [nif, setNif] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [idDocFront, setIdDocFront] = useState<File | null>(null);
  const [idDocBack, setIdDocBack] = useState<File | null>(null);
  const [idDocFrontPreview, setIdDocFrontPreview] = useState<string | null>(null);
  const [idDocBackPreview, setIdDocBackPreview] = useState<string | null>(null);
  const [idDocNif, setIdDocNif] = useState<File | null>(null);
  const [idDocNifPreview, setIdDocNifPreview] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nome.trim()) { setError('O nome é obrigatório.'); return; }
    if (!nif.trim()) { setError('O NIF é obrigatório.'); return; }
    if (!telefone.trim()) { setError('O telefone é obrigatório.'); return; }
    if (password !== confirmPassword) { setError('As palavras-passe não coincidem.'); return; }
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    if (tipo === 'comprador' && (!idDocFront || !idDocBack)) {
      setError('É obrigatório enviar a frente e verso do documento de identificação.');
      return;
    }
    if (tipo === 'vendedor' && sellerSubtype === 'pessoal' && (!idDocFront || !idDocBack)) {
      setError('É obrigatório enviar a frente e verso do documento de identificação.');
      return;
    }
    if (tipo === 'vendedor' && sellerSubtype === 'empresa' && !idDocNif) {
      setError('É obrigatório enviar o documento de confirmação do NIF da empresa.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, nome, { nif, telefone, tipo, sellerSubtype: tipo === 'vendedor' ? sellerSubtype : undefined });
    if (error) {
      setError(error.message.includes('already registered') ? 'Este email já está registado.' : error.message);
      setLoading(false);
      return;
    }
    // Upload ID documents after signup
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        // Buyer or Seller Pessoal: upload front + back
        if ((tipo === 'comprador' || (tipo === 'vendedor' && sellerSubtype === 'pessoal')) && idDocFront && idDocBack) {
          const frontExt = idDocFront.name.split('.').pop();
          const backExt = idDocBack.name.split('.').pop();
          const frontPath = `${userId}/id-front.${frontExt}`;
          const backPath = `${userId}/id-back.${backExt}`;
          await supabase.storage.from('id-documents').upload(frontPath, idDocFront);
          await supabase.storage.from('id-documents').upload(backPath, idDocBack);
          await supabase.from('profiles').update({
            id_doc_front_url: frontPath,
            id_doc_back_url: backPath,
            seller_subtype: tipo === 'vendedor' ? sellerSubtype : null,
          } as any).eq('user_id', userId);
        }
        // Seller Empresa: upload single NIF doc
        if (tipo === 'vendedor' && sellerSubtype === 'empresa' && idDocNif) {
          const nifExt = idDocNif.name.split('.').pop();
          const nifPath = `${userId}/nif-doc.${nifExt}`;
          await supabase.storage.from('id-documents').upload(nifPath, idDocNif);
          await supabase.from('profiles').update({
            id_doc_nif_url: nifPath,
            seller_subtype: sellerSubtype,
          } as any).eq('user_id', userId);
        }
      }
    } catch (uploadErr) {
      console.error('Error uploading ID docs:', uploadErr);
    }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <style>{`
          @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
          @keyframes scale-in { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
          @keyframes fade-up  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .success-icon { animation: scale-in .6s cubic-bezier(.34,1.56,.64,1) both; }
          .fu-1 { animation: fade-up .5s ease .2s both; }
          .fu-2 { animation: fade-up .5s ease .4s both; }
          .fu-3 { animation: fade-up .5s ease .6s both; }
          .shimmer-text {
            background: linear-gradient(90deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.5) 40%,hsl(var(--primary)) 80%);
            background-size:200% auto; -webkit-background-clip:text; background-clip:text;
            -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite;
          }
          .glow-ring { box-shadow: 0 0 0 6px hsl(var(--primary)/.12), 0 0 40px hsl(var(--primary)/.25); }
        `}</style>
        <div className="w-full max-w-md text-center">
          <div className="success-icon mx-auto w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-6 glow-ring">
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="fu-1 text-3xl font-black tracking-tight mb-2">
            Conta <span className="shimmer-text">criada!</span>
          </h2>
          <p className="fu-2 text-muted-foreground mb-2 text-sm leading-relaxed">
            Enviámos um email de confirmação para
          </p>
          <p className="fu-2 font-bold text-foreground mb-6 text-sm">{email}</p>
          <p className="fu-2 text-xs text-muted-foreground mb-4 leading-relaxed max-w-xs mx-auto">
            Verifique a sua caixa de entrada e clique no link de confirmação para activar a sua conta.
          </p>
          {tipo === 'comprador' && (
            <div className="fu-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">⏳ Verificação automática</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Após confirmar o email, o nosso sistema de inteligência artificial irá verificar
                se o número de identificação que digitou corresponde ao documento enviado.
                Se tudo estiver correto, a sua conta será aprovada automaticamente.
              </p>
            </div>
          )}
          {tipo === 'vendedor' && (
            <div className="fu-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">⏳ Verificação de documentos</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Após confirmar o email, o nosso sistema irá verificar os seus documentos
                para validar a sua identidade e NIF. A aprovação é automática.
              </p>
            </div>
          )}
          <div className="fu-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-12 font-black rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all gap-2 group"
            >
              Ir para Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `auth-input ${focused === field ? 'border-primary/55 !bg-background shadow-[0_0_0_3px_hsl(var(--primary)/.12)]' : ''}`;

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

      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative flex-col reg-panel-l overflow-hidden">
        <div className="auth-photo"><img src={heroBusiness} alt="Empresarios angolanos com Faktura" /></div>
        <div className="auth-grid" />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:520,height:520,background:'hsl(var(--primary)/.26)',filter:'blur(115px)',top:'8%',left:'-6%' }} />
        <div className="absolute z-[3] pointer-events-none rounded-full" style={{ width:300,height:300,background:'hsl(var(--primary)/.15)',filter:'blur(80px)',bottom:'12%',right:'8%' }} />
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          <Link to="/" className="self-start"><img src={logoFaktura} alt="Faktura Angola" className="h-9 object-contain" /></Link>
          <div className="my-auto">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-2 mb-7 cursor-default">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                {tipo === 'vendedor' ? 'Comece a faturar hoje' : 'Ganhe pontos em cada compra'}
              </span>
            </div>
            <h2 className="font-black text-white mb-4 leading-[.88]" style={{ fontSize:'clamp(2.4rem,4.5vw,4.5rem)',letterSpacing:'-0.025em' }}>
              {tipo === 'vendedor' ? (
                <>Junte-se às<br /><span className="shimmer-white">melhores empresas.</span></>
              ) : (
                <>Compre e<br /><span className="shimmer-white">ganhe recompensas.</span></>
              )}
            </h2>
            <p className="text-white/65 max-w-xs leading-relaxed mb-9 font-medium" style={{ fontSize:'clamp(.9rem,1.1vw,1.05rem)' }}>
              {tipo === 'vendedor'
                ? 'Centenas de empresas angolanas já confiam na Faktura para gerir a sua faturação.'
                : 'Receba 50 Kz por cada fatura acima de 1.500 Kz emitida com o seu ID único.'
              }
            </p>
            <div className="flex flex-col gap-2.5">
              {tipo === 'vendedor' ? (
                [{icon:Zap,label:'Grátis para começar'},{icon:Shield,label:'Conformidade total com a AGT'},{icon:BarChart3,label:'Dashboard com métricas'}].map(({icon:I,label},idx) => (
                  <div key={idx} className="glass-stat rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center flex-shrink-0"><I className="w-4 h-4 text-white" /></div>
                    <span className="text-white/80 text-sm font-semibold">{label}</span>
                  </div>
                ))
              ) : (
                [{icon:Star,label:'Acumule pontos e cashback'},{icon:ShoppingBag,label:'Histórico completo de compras'},{icon:BadgeDollarSign,label:'50 Kz por fatura qualificada'}].map(({icon:I,label},idx) => (
                  <div key={idx} className="glass-stat rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center flex-shrink-0"><I className="w-4 h-4 text-white" /></div>
                    <span className="text-white/80 text-sm font-semibold">{label}</span>
                  </div>
                ))
              )}
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

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 reg-panel-r overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoFaktura} alt="Faktura" className="h-10 object-contain" /></Link>
          </div>

          {/* Header */}
          <div className="fu-1 mb-5">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold">Criar conta grátis</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">
              Registe-se na <span className="shimmer-text">Faktura</span>
            </h1>
            <p className="text-muted-foreground text-sm">Escolha o seu perfil e comece agora</p>
          </div>

          {/* Type Toggle */}
          <div className="fu-2 mb-5">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setTipo('vendedor')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tipo === 'vendedor'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Store className="w-4 h-4" />
                Vendedor
              </button>
              <button
                type="button"
                onClick={() => setTipo('comprador')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tipo === 'comprador'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Comprador
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="fu-2 mb-4">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="fu-2 space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-bold">Nome Completo</Label>
              <Input id="nome" type="text" placeholder="António Manuel" value={nome} onChange={e => setNome(e.target.value)}
                onFocus={() => setFocused('nome')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('nome')} />
            </div>

            <div className="fu-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nif" className="text-sm font-bold">NIF</Label>
                <Input id="nif" type="text" placeholder="000000000" value={nif} onChange={e => setNif(e.target.value)}
                  onFocus={() => setFocused('nif')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('nif')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-sm font-bold">Telefone</Label>
                <Input id="telefone" type="tel" placeholder="+244 9XX XXX XXX" value={telefone} onChange={e => setTelefone(e.target.value)}
                  onFocus={() => setFocused('telefone')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('telefone')} />
              </div>
            </div>

            <div className="fu-3 space-y-1.5">
              <Label htmlFor="email" className="text-sm font-bold">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.ao" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('email')} />
            </div>

            <div className="fu-4 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-bold">Palavra-passe</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('password')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-bold">Confirmar</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)} required disabled={loading} className={inputClass('confirmPassword')} />
              </div>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => {
                    const strength = password.length < 6 ? 1 : password.length < 8 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
                    return (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength
                            ? strength === 1 ? 'hsl(var(--destructive))' : strength === 2 ? 'hsl(var(--warning, 45 93% 47%))' : strength === 3 ? 'hsl(var(--primary))' : 'hsl(142 76% 36%)'
                            : 'hsl(var(--border))',
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {password.length < 6 ? 'Fraca — mínimo 6 caracteres' : password.length < 8 ? 'Razoável' : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Muito forte ✓' : 'Boa — adicione maiúsculas e números'}
                </p>
              </div>
            )}

            {tipo === 'vendedor' && (
              <div className="fu-4 space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verificação de Identidade Obrigatória
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-3">Selecione o tipo de vendedor e envie os documentos correspondentes.</p>
                  
                  {/* Seller sub-type toggle */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button type="button" onClick={() => setSellerSubtype('pessoal')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        sellerSubtype === 'pessoal' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}>
                      Pessoal
                    </button>
                    <button type="button" onClick={() => setSellerSubtype('empresa')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        sellerSubtype === 'empresa' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}>
                      Empresa
                    </button>
                  </div>

                  {sellerSubtype === 'pessoal' ? (
                    <>
                      <p className="text-[11px] text-muted-foreground mb-2">Envie fotos do seu BI/Passaporte (frente e verso) para validação.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Frente do BI</Label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden">
                            {idDocFrontPreview ? (
                              <img src={idDocFrontPreview} alt="Frente" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-center p-2">
                                <Camera className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground">Carregar foto</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" disabled={loading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setIdDocFront(f); setIdDocFrontPreview(URL.createObjectURL(f)); } }} />
                          </label>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Verso do BI</Label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden">
                            {idDocBackPreview ? (
                              <img src={idDocBackPreview} alt="Verso" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-center p-2">
                                <Camera className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground">Carregar foto</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" disabled={loading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) { setIdDocBack(f); setIdDocBackPreview(URL.createObjectURL(f)); } }} />
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-muted-foreground mb-2">Envie o documento que confirma o NIF da sua empresa.</p>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Documento do NIF (Empresa)</Label>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden">
                          {idDocNifPreview ? (
                            <img src={idDocNifPreview} alt="NIF Doc" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="text-center p-2">
                              <Camera className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                              <span className="text-[10px] text-muted-foreground">Carregar documento do NIF</span>
                            </div>
                          )}
                          <input type="file" accept="image/*,.pdf" className="hidden" disabled={loading}
                            onChange={e => { const f = e.target.files?.[0]; if (f) { setIdDocNif(f); setIdDocNifPreview(f.type.startsWith('image') ? URL.createObjectURL(f) : null); } }} />
                        </label>
                        {idDocNif && !idDocNifPreview && (
                          <p className="text-[11px] text-primary font-medium">📄 {idDocNif.name}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {tipo === 'comprador' && (
              <div className="fu-4 space-y-3">
                <p className="text-xs text-muted-foreground/60">Receberá um ID Faktura único para acumular pontos nas suas compras.</p>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verificação de Identidade Obrigatória
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-3">Envie fotos do seu BI/Passaporte (frente e verso) para validação da sua conta.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Frente do BI</Label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden">
                        {idDocFrontPreview ? (
                          <img src={idDocFrontPreview} alt="Frente" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center p-2">
                            <Camera className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                            <span className="text-[10px] text-muted-foreground">Carregar foto</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" disabled={loading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) { setIdDocFront(f); setIdDocFrontPreview(URL.createObjectURL(f)); } }} />
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Verso do BI</Label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden">
                        {idDocBackPreview ? (
                          <img src={idDocBackPreview} alt="Verso" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center p-2">
                            <Camera className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                            <span className="text-[10px] text-muted-foreground">Carregar foto</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" disabled={loading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) { setIdDocBack(f); setIdDocBackPreview(URL.createObjectURL(f)); } }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fu-5 pt-1">
              <Button type="submit" disabled={loading}
                className="w-full h-12 text-base font-black rounded-xl shadow-lg shadow-primary/25 btn-glow ag hover:scale-[1.02] transition-all group gap-2">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> A criar conta...</>
                ) : (
                  <>Criar Conta {tipo === 'comprador' ? 'de Comprador' : 'de Vendedor'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          <div className="fu-5 mt-5 mb-4">
            <div className="auth-divider">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 whitespace-nowrap">Já tem conta?</span>
            </div>
          </div>

          <div className="fu-6">
            <Link to="/login">
              <Button variant="outline" className="w-full h-12 text-sm font-bold rounded-xl border-2 hover:bg-primary/5 hover:border-primary/40 hover:scale-[1.02] transition-all gap-2">
                Entrar na minha conta <ArrowRight className="h-4 w-4" />
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
        </div>
      </div>
    </div>
  );
}
