import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import logoPapel from '@/assets/faktura-logo.png';
import teamCollab from '@/assets/team-collab.jpg';

export default function Registar() {
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nome.trim().length < 3) { setError('Indica o teu nome completo.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Email inválido.'); return; }
    if (telefone.replace(/\D/g, '').length < 9) { setError('Número de telefone inválido.'); return; }
    if (password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres.'); return; }

    setLoading(true);
    const { error: signUpError } = await signUp(email.trim().toLowerCase(), password, nome.trim(), {
      nif: nif.replace(/\D/g, '') || undefined,
      telefone: telefone.trim(),
      tipo: 'empresa',
      empresaNome: empresa.trim() || undefined,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Já existe uma conta com este email.'
        : signUpError.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black">Confirma o teu email</h1>
          <p className="text-muted-foreground">
            Enviámos um link de confirmação para <strong>{email}</strong>. Depois de confirmares,
            entras no Papel e podes enviar o teu primeiro SAF-T.
          </p>
          <Button asChild className="w-full"><Link to="/login">Voltar ao login</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[44%] relative flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img src={teamCollab} alt="Equipa" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.9) 100%)',
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/"><img src={logoPapel} alt="Papel" className="h-16 object-contain" /></Link>
          <div>
            <h2 className="text-white font-black leading-[0.95] mb-4" style={{ fontSize: 'clamp(2rem,3.2vw,3rem)' }}>
              A tua faturação<br /><span className="text-primary">vale crédito.</span>
            </h2>
            <p className="text-white/70 max-w-sm">
              Cria a conta, envia o SAF-T e descobre em minutos quanto capital de giro a tua
              empresa pode obter.
            </p>
          </div>
          <p className="text-white/40 text-xs">Papel · Faktura Angola · NIF 5002964031</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoPapel} alt="Papel" className="h-20 object-contain" /></Link>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2">Criar conta</h1>
          <p className="text-muted-foreground text-sm mb-6">Leva menos de um minuto.</p>

          {error && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Nome da empresa</Label>
              <Input id="empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nif">NIF da empresa</Label>
              <Input id="nif" value={nif} onChange={e => setNif(e.target.value)} inputMode="numeric"
                     placeholder="5000000000" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                     autoComplete="email" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)}
                     placeholder="+244 9XX XXX XXX" inputMode="tel" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                       onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                       disabled={loading} className="pr-10" placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Criar conta
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              Ao criar conta aceitas os <Link to="/termos" className="underline">Termos</Link> e a{' '}
              <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
            </p>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Já tens conta? <Link to="/login" className="text-primary font-bold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
