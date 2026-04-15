import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, ArrowRight, Zap, Shield, BarChart3,
  CheckCircle, FileText, BadgeDollarSign, Sparkles,
  Users, TrendingUp, Lock, Eye, EyeOff, X, Mail, Smartphone,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoFaktura from '@/assets/logo-faktura.png';
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
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes shimmer-grad { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes float-a  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(1.5deg)} }
        @keyframes float-b  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-c  { 0%,100%{transform:translateY(0) rotate(-1deg)} 60%{transform:translateY(-16px) rotate(.5deg)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(2.5);opacity:0} }
        @keyframes blink-dot  { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(252,211,77,.9)} 50%{opacity:.2;box-shadow:none} }
        @keyframes glow-btn   { 0%,100%{box-shadow:0 4px 28px rgba(217,119,6,.35)} 50%{box-shadow:0 6px 44px rgba(217,119,6,.6),0 0 0 5px rgba(217,119,6,.08)} }
        @keyframes grid-drift { from{background-position:0 0} to{background-position:56px 56px} }
        @keyframes scan-down  { 0%{top:-4px;opacity:0} 8%{opacity:1} 92%{opacity:.5} 100%{top:100%;opacity:0} }
        @keyframes slide-l    { from{opacity:0;transform:translateX(-52px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slide-r    { from{opacity:0;transform:translateX(52px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fade-up    { from{opacity:0;transform:translateY(26px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes spin-cw    { to{transform:rotate(360deg)} }
        @keyframes spin-ccw   { to{transform:rotate(-360deg)} }
        @keyframes data-drift { 0%{opacity:0;transform:translateY(10px)} 20%{opacity:1} 80%{opacity:.5} 100%{opacity:0;transform:translateY(-52px)} }

        .l-panel { animation:slide-l .95s cubic-bezier(.22,1,.36,1) both; }
        .r-panel { animation:slide-r .95s cubic-bezier(.22,1,.36,1) .1s both; }

        .fu1{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .2s  both}
        .fu2{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .35s both}
        .fu3{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .5s  both}
        .fu4{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .65s both}
        .fu5{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .8s  both}
        .fu6{animation:fade-up .65s cubic-bezier(.4,0,.2,1) .95s both}

        .fl-a{animation:float-a 5s ease-in-out infinite}
        .fl-b{animation:float-b 4s ease-in-out infinite}
        .fl-c{animation:float-c 6.5s ease-in-out 1.2s infinite}

        /* ── HERO PANEL ── */
        .hero-panel {
          width:52%; position:relative; overflow:hidden;
          display:flex; flex-direction:column;
        }
        .hero-photo { position:absolute; inset:0; }
        .hero-photo img { width:100%; height:100%; object-fit:cover; object-position:center 25%; }
        .hero-photo::after {
          content:''; position:absolute; inset:0;
          background:
            linear-gradient(180deg,rgba(6,5,26,.75) 0%,rgba(6,5,26,.18) 36%,rgba(6,5,26,.4) 68%,rgba(6,5,26,.94) 100%),
            linear-gradient(105deg,rgba(217,119,6,.58) 0%,transparent 52%);
        }

        /* Tech overlay grid on photo */
        .hero-grid {
          position:absolute; inset:0; z-index:1; pointer-events:none; opacity:.06;
          background-image:
            linear-gradient(rgba(252,211,77,1) 1px,transparent 1px),
            linear-gradient(90deg,rgba(252,211,77,1) 1px,transparent 1px);
          background-size:56px 56px;
          animation:grid-drift 12s linear infinite;
        }
        .scanline {
          position:absolute; left:0; right:0; height:3px; z-index:2; pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(252,211,77,.5),rgba(255,255,255,.4),rgba(252,211,77,.5),transparent);
          animation:scan-down 8s ease-in-out infinite;
        }

        /* Orbs */
        .h-orb { position:absolute; border-radius:50%; pointer-events:none; z-index:1; filter:blur(72px); }

        /* Spinning rings */
        .spin-ring { position:absolute; border-radius:50%; border:1px solid rgba(245,158,11,.16); pointer-events:none; z-index:1; }

        /* Data particles */
        .d-par {
          position:absolute; font-family:'JetBrains Mono',monospace;
          font-size:10px; color:rgba(252,211,77,.18);
          pointer-events:none; user-select:none; z-index:2;
          animation:data-drift 9s ease-in-out infinite;
        }

        .hero-content {
          position:relative; z-index:3;
          display:flex; flex-direction:column; justify-content:space-between;
          height:100%; padding:36px 44px;
        }

        /* Live pill */
        .live-pill {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.22);
          backdrop-filter:blur(12px); border-radius:100px;
          padding:6px 14px; font-size:11px; font-weight:800;
          color:#fff; letter-spacing:.07em; text-transform:uppercase;
          width:fit-content; margin-bottom:22px;
        }
        .l-dot {
          width:7px; height:7px; border-radius:50%; background:#FCD34D;
          animation:blink-dot 2s infinite; flex-shrink:0;
        }

        /* Hero title */
        .h-title {
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:clamp(2.4rem,4vw,4.4rem); font-weight:900;
          letter-spacing:-.04em; line-height:.9; color:#fff; margin-bottom:14px;
        }
        .h-accent {
          background:linear-gradient(90deg,#fff 0%,#FCD34D 30%,#F59E0B 60%,#fff 100%);
          background-size:300% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimmer-grad 4s linear infinite; display:block;
        }

        /* Feature items */
        .feat-item {
          display:flex; align-items:center; gap:12px;
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14);
          backdrop-filter:blur(16px); border-radius:14px;
          padding:11px 16px; cursor:default; margin-bottom:8px;
          transition:all .25s ease;
        }
        .feat-item:hover { background:rgba(255,255,255,.15); transform:translateX(7px); border-color:rgba(252,211,77,.45); }
        .feat-ico { width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Stat chips */
        .stat-bar { display:flex; flex-wrap:wrap; gap:10px; }
        .s-chip {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14);
          backdrop-filter:blur(12px); border-radius:11px; padding:8px 14px;
          transition:all .25s;
        }
        .s-chip:hover { background:rgba(255,255,255,.15); transform:translateY(-3px); }

        /* Floating badge cards */
        .f-card {
          position:absolute; z-index:20;
          background:rgba(255,255,255,.97); border:1px solid rgba(245,158,11,.2);
          border-radius:16px; padding:12px 16px;
          display:flex; align-items:center; gap:12px;
          box-shadow:0 12px 44px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.06);
          backdrop-filter:blur(20px);
        }
        .p-ring { position:absolute; inset:-6px; border-radius:50%; border:2px solid rgba(245,158,11,.45); animation:pulse-ring 2.2s ease-out infinite; }

        /* ── FORM PANEL ── */
        .form-panel {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:48px; background:#fff; overflow-y:auto; position:relative; z-index:2;
        }
        /* Subtle background grid on form side */
        .form-panel::before {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:0; opacity:.022;
          background-image:
            linear-gradient(rgba(217,119,6,1) 1px,transparent 1px),
            linear-gradient(90deg,rgba(217,119,6,1) 1px,transparent 1px);
          background-size:48px 48px;
        }
        .form-inner { width:100%; max-width:420px; position:relative; z-index:1; }

        /* The main form box */
        .form-box {
          background:#fff; border:1.5px solid rgba(245,158,11,.2);
          border-radius:26px; padding:40px 36px;
          box-shadow:0 4px 60px rgba(217,119,6,.09),0 0 0 1px rgba(245,158,11,.06);
          position:relative; overflow:hidden;
        }
        /* Top shimmer line */
        .form-box::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,rgba(245,158,11,.7),rgba(252,211,77,1),rgba(245,158,11,.7),transparent);
        }
        /* Corner radial glow */
        .form-box::after {
          content:''; position:absolute; bottom:0; right:0; width:140px; height:140px; pointer-events:none;
          background:radial-gradient(circle at bottom right,rgba(245,158,11,.07),transparent 70%);
        }

        /* Field labels */
        .f-lbl {
          font-size:11.5px; font-weight:800; color:#64748b;
          text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .f-grp { margin-bottom:18px; }

        /* ID field */
        .id-wrap {
          display:flex; align-items:center; height:52px;
          border-radius:15px; overflow:hidden;
          border:1.5px solid rgba(245,158,11,.22);
          background:#fffbeb; transition:all .25s;
        }
        .id-wrap.on {
          border-color:rgba(245,158,11,.7);
          box-shadow:0 0 0 3px rgba(245,158,11,.12),0 2px 18px rgba(245,158,11,.1);
          background:#fff;
        }
        .id-pfx {
          display:flex; align-items:center; justify-content:center;
          padding:0 14px; height:100%;
          background:linear-gradient(135deg,rgba(217,119,6,.1),rgba(245,158,11,.07));
          border-right:1.5px solid rgba(245,158,11,.16);
          font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700;
          color:rgba(217,119,6,.85); letter-spacing:.04em; user-select:none; white-space:nowrap;
        }
        .id-in {
          flex:1; height:100%; padding:0 12px;
          background:transparent; border:none; outline:none;
          font-family:'JetBrains Mono',monospace !important;
          font-size:16px; font-weight:700; letter-spacing:.35em; color:#1c1007;
        }
        .id-in::placeholder { color:rgba(245,158,11,.22); letter-spacing:.4em; }
        .id-in:disabled { opacity:.5; }
        .id-prev { font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(245,158,11,.55); padding:5px 4px 0; letter-spacing:.04em; }

        /* Password */
        .pw-wrap {
          position:relative; height:52px;
          border-radius:15px; overflow:hidden;
          border:1.5px solid rgba(245,158,11,.22); background:#fffbeb;
          display:flex; align-items:center; transition:all .25s;
        }
        .pw-wrap.on {
          border-color:rgba(245,158,11,.7);
          box-shadow:0 0 0 3px rgba(245,158,11,.12),0 2px 18px rgba(245,158,11,.1);
          background:#fff;
        }
        .pw-in {
          flex:1; height:100%; padding:0 46px 0 16px;
          background:transparent; border:none; outline:none;
          font-size:14px; color:#1c1007; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .pw-in::placeholder { color:rgba(245,158,11,.28); }
        .pw-tog {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; padding:5px; border-radius:8px;
          color:rgba(245,158,11,.45); transition:all .2s;
          display:flex; align-items:center; justify-content:center;
        }
        .pw-tog:hover { background:rgba(245,158,11,.1); color:rgba(217,119,6,.9); }

        /* Submit */
        .sub-btn {
          width:100%; height:54px; border-radius:16px; border:none;
          background:linear-gradient(135deg,#D97706 0%,#F59E0B 60%,#FBBF24 100%);
          color:#fff; font-size:14px; font-weight:800;
          letter-spacing:.08em; text-transform:uppercase;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;
          position:relative; overflow:hidden; transition:all .25s;
          animation:glow-btn 3.5s ease-in-out infinite;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .sub-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,.16) 0%,transparent 55%);
          pointer-events:none;
        }
        .sub-btn:hover:not(:disabled) {
          transform:translateY(-2px) scale(1.01);
          box-shadow:0 14px 52px rgba(217,119,6,.58),0 0 0 1px rgba(245,158,11,.4) !important;
          animation:none;
        }
        .sub-btn:active:not(:disabled) { transform:scale(.98); }
        .sub-btn:disabled { opacity:.55; cursor:not-allowed; animation:none; }
        .sub-btn .arr { transition:transform .2s; }
        .sub-btn:hover:not(:disabled) .arr { transform:translateX(5px); }

        /* Alerts */
        .e-box {
          display:flex; align-items:flex-start; gap:10px;
          background:#fef2f2; border:1px solid #fecaca;
          border-radius:13px; padding:12px 14px; margin-bottom:18px;
          font-size:13px; color:#b91c1c; font-weight:500;
        }
        .lk-box {
          display:flex; align-items:flex-start; gap:10px;
          background:#fffbeb; border:1px solid #fcd34d;
          border-radius:13px; padding:12px 14px; margin-bottom:18px;
          font-size:13px; color:#92400e; font-weight:500;
        }

        /* Links */
        .a-p { color:#D97706; font-size:12px; font-weight:700; text-decoration:none; transition:all .2s; }
        .a-p:hover { color:#F59E0B; }
        .a-sm { color:#999; font-size:13px; font-weight:500; text-decoration:none; transition:color .2s; }
        .a-sm:hover { color:#D97706; }
        .a-sm span { color:#D97706; font-weight:700; }

        /* Divider */
        .dvdr { display:flex; align-items:center; gap:10px; margin:20px 0; }
        .dv-l { flex:1; height:1px; background:rgba(245,158,11,.15); }
        .dv-t { font-size:10.5px; font-weight:800; color:#bbb; letter-spacing:.08em; white-space:nowrap; }

        /* Recovery links */
        .rec-a {
          display:flex; align-items:center; gap:9px;
          color:#D97706; font-size:13px; font-weight:700;
          text-decoration:none; padding:10px 16px; border-radius:13px;
          border:1.5px solid rgba(245,158,11,.2); background:rgba(245,158,11,.04);
          transition:all .22s; justify-content:center;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .rec-a:hover { background:rgba(245,158,11,.1); border-color:rgba(245,158,11,.45); transform:translateY(-2px); box-shadow:0 4px 20px rgba(217,119,6,.12); }

        /* Sec row */
        .sec-r { display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; color:#ccc; margin-top:20px; }

        @media(max-width:900px){
          .hero-panel{ display:none !important; }
          .form-panel{ padding:28px 20px; }
        }
      `}</style>

      {/* ══════════════ LEFT HERO PANEL ══════════════ */}
      <div className="hero-panel l-panel">
        {/* Background photo */}
        <div className="hero-photo">
          <img src={heroBusiness} alt="Empresários angolanos com Faktura" />
        </div>

        {/* Tech overlays */}
        <div className="hero-grid" />
        <div className="scanline" />

        {/* Orb glows */}
        <div className="h-orb" style={{ width:520, height:520, background:'radial-gradient(circle,rgba(217,119,6,.42) 0%,transparent 70%)', top:'-170px', left:'-90px' }} />
        <div className="h-orb" style={{ width:320, height:320, background:'radial-gradient(circle,rgba(245,158,11,.24) 0%,transparent 70%)', bottom:'-60px', right:'8%', animationDelay:'1.8s' }} />

        {/* Spinning rings */}
        <div style={{ position:'absolute', top:'50%', left:'56%', transform:'translate(-50%,-50%)', zIndex:1, pointerEvents:'none' }}>
          <div className="spin-ring" style={{ width:400, height:400, borderTopColor:'rgba(245,158,11,.5)', animation:'spin-cw 24s linear infinite', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
          <div className="spin-ring" style={{ width:272, height:272, borderRightColor:'rgba(252,211,77,.38)', animation:'spin-ccw 16s linear infinite', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
          <div className="spin-ring" style={{ width:180, height:180, borderBottomColor:'rgba(217,119,6,.3)', animation:'spin-cw 10s linear infinite', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
        </div>

        {/* Data particles */}
        {['FK-244','AGT✓','TLS','0xA3','AES','2048b','244.aok','HASH','SHA'].map((t,i) => (
          <div key={i} className="d-par" style={{ left:`${4+i*11}%`, top:`${10+(i%4)*18}%`, animationDelay:`${i*1.05}s`, animationDuration:`${8+i*.8}s` }}>{t}</div>
        ))}

        {/* Main content */}
        <div className="hero-content">
          {/* Logo */}
          <Link to="/" style={{ display:'inline-block' }}>
            <img src={logoFaktura} alt="Faktura Angola" style={{ height:62, objectFit:'contain', filter:'drop-shadow(0 2px 16px rgba(217,119,6,.45)) brightness(1.05)' }} />
          </Link>

          {/* Hero body */}
          <div style={{ marginTop:'auto', marginBottom:'auto' }}>
            <div className="live-pill">
              <div className="l-dot" />
              Plataforma #1 de faturação em Angola
              <div className="l-dot" style={{ animationDelay:'.6s' }} />
            </div>

            <h2 className="h-title">
              Faturação<br />
              <span className="h-accent">simplificada.</span>
            </h2>

            <p style={{ color:'rgba(255,255,255,.52)', maxWidth:285, lineHeight:1.72, fontSize:13, fontWeight:500, marginBottom:28 }}>
              Rápida, segura e em conformidade total com a AGT. Tudo num só lugar.
            </p>

            <div>
              {[
                { icon:<Zap size={15} color="#FCD34D" />,       label:'Emissão de faturas em segundos' },
                { icon:<Shield size={15} color="#FCD34D" />,    label:'Conformidade total com a AGT' },
                { icon:<BarChart3 size={15} color="#FCD34D" />, label:'Relatórios e métricas em tempo real' },
              ].map(({ icon, label }, i) => (
                <div key={i} className="feat-item">
                  <div className="feat-ico">{icon}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.75)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="stat-bar">
            {[
              { icon:<Users size={13} color="rgba(255,255,255,.5)" />,      v:'500+',  l:'Empresas' },
              { icon:<FileText size={13} color="rgba(255,255,255,.5)" />,   v:'50k+',  l:'Faturas' },
              { icon:<TrendingUp size={13} color="rgba(255,255,255,.5)" />, v:'99%',   l:'Uptime' },
            ].map(({ icon,v,l },i) => (
              <div key={i} className="s-chip">
                {icon}
                <span style={{ fontSize:13, fontWeight:900, color:'#fff' }}>{v}</span>
                <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.36)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Floating badge cards ── */}
        {/* AGT badge */}
        <div className="f-card fl-a" style={{ top:'22%', right:'-3%' }}>
          <div style={{ position:'relative' }}>
            <div className="p-ring" />
            <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle size={17} color="#D97706" />
            </div>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:'#1c1007', margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Conformidade AGT</p>
            <p style={{ fontSize:11, color:'#888', margin:0 }}>100% certificado</p>
          </div>
        </div>

        {/* Invoice badge */}
        <div className="f-card fl-b" style={{ top:'49%', right:'13%' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={15} color="#D97706" />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:'#1c1007', margin:0, fontFamily:"'JetBrains Mono',monospace" }}>FT 2026/1284</p>
            <p style={{ fontSize:11, color:'#D97706', margin:0, fontWeight:700 }}>✓ Enviada via WhatsApp</p>
          </div>
        </div>

        {/* Credit badge */}
        <div className="f-card fl-c" style={{ bottom:'22%', right:'1%' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(29,158,117,.1)', border:'1px solid rgba(29,158,117,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <BadgeDollarSign size={15} color="#1D9E75" />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:'#1c1007', margin:0 }}>+50 Kz creditados</p>
            <p style={{ fontSize:11, color:'#888', margin:0, fontFamily:"'JetBrains Mono',monospace" }}>FK-244-000244 · agora</p>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT FORM PANEL ══════════════ */}
      <div className="form-panel r-panel">
        <div className="form-inner">

          {/* Mobile only logo */}
          <div className="fu1" style={{ display:'flex', justifyContent:'center', marginBottom:28 }}>
            <Link to="/" style={{ display:'inline-block' }} className="lg:hidden">
              <img src={logoFaktura} alt="Faktura Angola" style={{ height:54, objectFit:'contain' }} />
            </Link>
          </div>

          {/* Title */}
          <div className="fu1" style={{ textAlign:'center', marginBottom:26 }}>
            <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-.04em', color:'#1c1007', margin:'0 0 4px' }}>
              Bem-vindo à{' '}
              <span style={{
                background:'linear-gradient(90deg,#D97706 0%,#F59E0B 35%,#FCD34D 65%,#D97706 100%)',
                backgroundSize:'300% auto',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                animation:'shimmer-grad 4s linear infinite',
              }}>Faktura</span>
            </h1>
            <p style={{ fontSize:13, color:'#999', fontWeight:500, margin:0 }}>
              Acede à tua conta com o teu ID pessoal
            </p>
          </div>

          {/* Form card */}
          <div className="form-box fu2">

            {/* Sparkle icon */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
              <div style={{
                width:52, height:52, borderRadius:'50%',
                background:'linear-gradient(135deg,rgba(217,119,6,.1),rgba(245,158,11,.07))',
                border:'1.5px solid rgba(245,158,11,.22)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 24px rgba(245,158,11,.16)',
              }}>
                <Sparkles size={22} color="#F59E0B" />
              </div>
            </div>

            {/* Errors */}
            {error && (
              <div className="e-box fu2">
                <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
                <span>{error}</span>
              </div>
            )}
            {isLocked && (
              <div className="lk-box fu2">
                <Lock size={15} style={{ flexShrink:0, marginTop:1 }} />
                <span>Conta bloqueada. Tenta em <strong>{formatCountdown(countdown)}</strong></span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Faktura ID */}
              <div className="f-grp fu3">
                <div className="f-lbl">O teu ID Faktura</div>
                <div className={`id-wrap ${focused === 'digits' ? 'on' : ''}`}>
                  <div className="id-pfx">FK · 244</div>
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
                    className="id-in"
                    autoComplete="off"
                  />
                  {digits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setDigits(''); digitsRef.current?.focus(); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(245,158,11,.45)', padding:'4px 10px 4px 4px', display:'flex', alignItems:'center' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {digits.length > 0 && (
                  <div className="id-prev">FK-244-{digits.padEnd(6, '_')}</div>
                )}
              </div>

              {/* Password */}
              <div className="f-grp fu3">
                <div className="f-lbl">
                  <span>Código de acesso</span>
                  <Link to="/recuperar-senha" className="a-p">Esqueceste o código?</Link>
                </div>
                <div className={`pw-wrap ${focused === 'password' ? 'on' : ''}`}>
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
                    className="pw-in"
                  />
                  <button type="button" className="pw-tog" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="fu4">
                <button type="submit" className="sub-btn" disabled={loading || isLocked}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> A entrar...</>
                    : <>ENTRAR <ArrowRight size={16} className="arr" /></>
                  }
                </button>
              </div>
            </form>

            {/* Recovery */}
            <div className="dvdr">
              <div className="dv-l" />
              <span className="dv-t">RECUPERAR ACESSO</span>
              <div className="dv-l" />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="fu5">
              <Link to="/recuperar-senha" className="rec-a">
                <Mail size={14} />
                Reenviar ID por Email
              </Link>
              <Link to="/recuperar-senha" className="rec-a">
                <Smartphone size={14} />
                Reenviar ID por SMS
              </Link>
            </div>
          </div>

          {/* Register link */}
          <div className="fu5" style={{ textAlign:'center', marginTop:22 }}>
            <Link to="/registar" className="a-sm">
              Ainda não tens ID? <span>Criar Faktura ID →</span>
            </Link>
          </div>

          {/* Security */}
          <div className="sec-r fu6">
            <Lock size={11} />
            <span>Ligação segura · Dados encriptados TLS/SSL</span>
          </div>

          <div style={{ textAlign:'center', marginTop:10 }}>
            <p style={{ fontSize:11, color:'#ddd', fontStyle:'italic' }}>Sem a Faktura, não fakturo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}