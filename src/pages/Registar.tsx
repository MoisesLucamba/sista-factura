import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PERFIS, AccountType, isNifValido, isTelefoneValido, isEmailValido, isEmailInstitucional,
} from '@/lib/perfis';
import {
  Loader2, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import logoPapel from '@/assets/faktura-logo.png';
import teamCollab from '@/assets/team-collab.jpg';

function Campo({ id, label, type = 'text', placeholder, hint, value, onChange, disabled }: {
  id: string; label: string; type?: string; placeholder?: string; hint?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange}
             placeholder={placeholder} disabled={disabled} />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type Campos = Record<string, string>;

export default function Registar() {
  const [searchParams] = useSearchParams();
  const perfilInicial = searchParams.get('perfil') as AccountType | null;
  const [tipo, setTipo] = useState<AccountType | null>(
    PERFIS.some(p => p.id === perfilInicial) ? perfilInicial : null
  );
  const [f, setF] = useState<Campos>({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const validar = (): string | null => {
    const nome = (f.nome || '').trim();
    if (tipo === 'particular') {
      if (nome.length < 3) return 'Indica o teu nome completo.';
      if (!(f.bi_numero || '').trim()) return 'Indica o número do BI ou documento de identificação.';
      if (!isEmailValido(f.email || '')) return 'Email inválido.';
      if (!isTelefoneValido(f.telefone || '')) return 'Número de telemóvel inválido.';
    }
    if (tipo === 'empresa') {
      if (nome.length < 3) return 'Indica o nome da empresa.';
      if (!isNifValido(f.nif || '')) return 'NIF inválido. Deve ter entre 9 e 14 dígitos.';
      if (!(f.sector_actividade || '').trim()) return 'Indica o sector de actividade.';
      if (!(f.responsavel_nome || '').trim()) return 'Indica o nome do responsável.';
      if (!isEmailValido(f.email || '')) return 'Email inválido.';
      if (!isTelefoneValido(f.telefone || '')) return 'Número de telemóvel inválido.';
    }
    if (tipo === 'banco' || tipo === 'seguradora') {
      if (nome.length < 3) return 'Indica o nome da instituição.';
      if (!isNifValido(f.nif || '')) return 'NIF / número de registo inválido.';
      if (!(f.licenca_numero || '').trim())
        return tipo === 'banco' ? 'Indica o número da licença do BNA.' : 'Indica o número da autorização da ARSEG.';
      if (!(f.responsavel_nome || '').trim()) return 'Indica o nome do responsável.';
      if (!isEmailInstitucional(f.email || ''))
        return 'Usa um email institucional (não são aceites emails pessoais como gmail ou hotmail).';
      if (!isTelefoneValido(f.telefone || '')) return 'Número de telemóvel inválido.';
      if (tipo === 'banco' && !(f.iban_institucional || '').trim())
        return 'Indica o IBAN institucional para movimentação de fundos.';
      if (tipo === 'seguradora' && !(f.produtos_seguro || '').trim())
        return 'Indica os tipos de produtos de seguro que pretendes oferecer.';
    }
    if (password.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validar();
    setError(msg);
    if (msg) return;

    setLoading(true);
    const nomeConta = (f.nome || '').trim();
    const { error: signUpError } = await signUp(
      (f.email || '').trim().toLowerCase(),
      password,
      tipo === 'particular' ? nomeConta : (f.responsavel_nome || nomeConta),
      {
        account_type: tipo,
        nif: (f.nif || '').replace(/\D/g, '') || undefined,
        telefone: (f.telefone || '').trim() || undefined,
        bi_numero: f.bi_numero,
        data_nascimento: f.data_nascimento,
        morada: f.morada || f.endereco,
        sector_actividade: f.sector_actividade,
        responsavel_nome: f.responsavel_nome,
        responsavel_cargo: f.responsavel_cargo,
        instituicao_nome: tipo === 'particular' ? undefined : nomeConta,
        registo_numero: f.nif,
        licenca_numero: f.licenca_numero,
        iban_institucional: f.iban_institucional,
        integracao_contacto: f.integracao_contacto,
        produtos_seguro: f.produtos_seguro,
      }
    );
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
            Enviámos um link de confirmação para <strong>{f.email}</strong>. Depois de confirmares,
            entras no Papel.
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
              Uma plataforma,<br /><span className="text-primary">quatro perfis.</span>
            </h2>
            <p className="text-white/70 max-w-sm">
              Particulares, empresas, bancos e seguradoras — todos no mesmo circuito de originação
              de crédito, com a Papel a registar cada passo.
            </p>
          </div>
          <p className="text-white/40 text-xs">Papel · Faktura Angola · NIF 5002964031</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoPapel} alt="Papel" className="h-20 object-contain" /></Link>
          </div>

          {!tipo ? (
            <>
              <h1 className="text-3xl font-black tracking-tight mb-2">Que tipo de conta queres?</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Escolhe o teu perfil. Só te pedimos os dados que realmente interessam.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PERFIS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setTipo(p.id); setError(null); }}
                      className="group text-left rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="font-bold">{p.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.descricao}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                        Continuar <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8">
                Já tens conta? <Link to="/login" className="text-primary font-bold hover:underline">Entrar</Link>
              </p>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setTipo(null); setError(null); }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-3 h-3" /> Mudar tipo de conta
              </button>

              <h1 className="text-3xl font-black tracking-tight mb-1">
                {PERFIS.find(p => p.id === tipo)!.titulo}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {PERFIS.find(p => p.id === tipo)!.descricao}
              </p>

              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {tipo === 'particular' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome completo *" />
                    <Campo value={f.bi_numero ?? ''} onChange={set('bi_numero')} disabled={loading} id="bi_numero" label="BI / Documento de identificação *" placeholder="00XXXXXXXLA0XX" />
                    <Campo value={f.data_nascimento ?? ''} onChange={set('data_nascimento')} disabled={loading} id="data_nascimento" label="Data de nascimento" type="date" />
                    <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email *" type="email" />
                    <Campo value={f.morada ?? ''} onChange={set('morada')} disabled={loading} id="morada" label="Morada" placeholder="Rua, bairro, município, província" />
                  </>
                )}

                {tipo === 'empresa' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome da empresa *" />
                    <Campo value={f.nif ?? ''} onChange={set('nif')} disabled={loading} id="nif" label="NIF *" placeholder="5000000000" />
                    <Campo value={f.sector_actividade ?? ''} onChange={set('sector_actividade')} disabled={loading} id="sector_actividade" label="Sector de actividade *" placeholder="Comércio a retalho, construção, serviços…" />
                    <Campo value={f.morada ?? ''} onChange={set('morada')} disabled={loading} id="morada" label="Endereço da sede" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo value={f.responsavel_nome ?? ''} onChange={set('responsavel_nome')} disabled={loading} id="responsavel_nome" label="Responsável *" />
                      <Campo value={f.responsavel_cargo ?? ''} onChange={set('responsavel_cargo')} disabled={loading} id="responsavel_cargo" label="Cargo" placeholder="Administrador, CFO…" />
                    </div>
                    <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email *" type="email" />
                    <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
                      Depois de confirmares o email, submetes os teus ficheiros <strong>SAF-T (AO)</strong> em
                      <strong> Enviar SAF-T</strong> para gerar o teu Papel Score.
                    </div>
                  </>
                )}

                {tipo === 'banco' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome da instituição *" />
                    <Campo value={f.nif ?? ''} onChange={set('nif')} disabled={loading} id="nif" label="NIF / nº de registo bancário *" />
                    <Campo value={f.licenca_numero ?? ''} onChange={set('licenca_numero')} disabled={loading} id="licenca_numero" label="Nº de licença / autorização do BNA *" />
                    <Campo value={f.responsavel_nome ?? ''} onChange={set('responsavel_nome')} disabled={loading} id="responsavel_nome" label="Responsável de onboarding *" />
                    <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email institucional *" type="email" placeholder="nome@banco.ao"
                           hint="Não são aceites emails pessoais (gmail, hotmail, outlook…)." />
                    <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    <Campo value={f.iban_institucional ?? ''} onChange={set('iban_institucional')} disabled={loading} id="iban_institucional" label="IBAN institucional *" placeholder="AO06 0000 0000 0000 0000 0000 0" />
                    <div className="space-y-2">
                      <Label htmlFor="integracao_contacto">Contacto técnico para integração (API / webhook)</Label>
                      <Textarea id="integracao_contacto" value={f.integracao_contacto ?? ''}
                                onChange={set('integracao_contacto')} disabled={loading}
                                placeholder="Email da equipa técnica e URL de webhook para notificações da Papel" />
                    </div>
                  </>
                )}

                {tipo === 'seguradora' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome da seguradora *" />
                    <Campo value={f.nif ?? ''} onChange={set('nif')} disabled={loading} id="nif" label="NIF / nº de registo *" />
                    <Campo value={f.licenca_numero ?? ''} onChange={set('licenca_numero')} disabled={loading} id="licenca_numero" label="Nº de licença / autorização da ARSEG *" />
                    <Campo value={f.responsavel_nome ?? ''} onChange={set('responsavel_nome')} disabled={loading} id="responsavel_nome" label="Responsável *" />
                    <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email institucional *" type="email" placeholder="nome@seguradora.ao"
                           hint="Não são aceites emails pessoais (gmail, hotmail, outlook…)." />
                    <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    <div className="space-y-2">
                      <Label htmlFor="produtos_seguro">Produtos de seguro a oferecer *</Label>
                      <Textarea id="produtos_seguro" value={f.produtos_seguro ?? ''}
                                onChange={set('produtos_seguro')} disabled={loading}
                                placeholder="Multirriscos, acidentes de trabalho, responsabilidade civil, automóvel…" />
                    </div>
                  </>
                )}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
