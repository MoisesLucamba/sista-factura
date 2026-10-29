import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import logoGiroDark from '@/assets/giro-logo-dark.svg';
import logoGiroLight from '@/assets/giro-logo-light.svg';
import teamCollab from '@/assets/team-collab.jpg';
import { TERMOS_VERSION } from '@/lib/legal/termos';
import { PRIVACIDADE_VERSION } from '@/lib/legal/privacidade';
import { cancelRegistrationConsent, prepareRegistrationConsent } from '@/lib/legal/consent';

/* Transição suave entre passos */
const Fade = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
    {children}
  </div>
);

function Campo({ id, label, type = 'text', placeholder, hint, value, onChange, disabled }: {
  id: string; label: string; type?: string; placeholder?: string; hint?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 rounded-lg"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const Par = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
);

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
  const [legalAccepted, setLegalAccepted] = useState(false);

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
    if (!legalAccepted) return 'Tens de aceitar os Termos e a Política de Privacidade.';
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
    let consentNonce: string;
    try {
      consentNonce = await prepareRegistrationConsent({
        email: (f.email || '').trim().toLowerCase(),
        terms_version: TERMOS_VERSION,
        privacy_version: PRIVACIDADE_VERSION,
      });
    } catch (consentError) {
      setLoading(false);
      setError(consentError instanceof Error ? consentError.message : 'Não foi possível guardar o aceite dos documentos.');
      return;
    }
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
        giro_consent_nonce: consentNonce,
      }
    );
    setLoading(false);

    if (signUpError) {
      await cancelRegistrationConsent(consentNonce);
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
        <Fade>
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Confirma o teu email</h1>
            <p className="text-muted-foreground leading-relaxed">
              Enviámos um link de confirmação para <strong className="text-foreground">{f.email}</strong>.
              Depois de confirmares, entras no Giro.
            </p>
            <Button asChild className="w-full h-11"><Link to="/login">Voltar ao login</Link></Button>
          </div>
        </Fade>
      </div>
    );
  }

  const perfil = tipo ? PERFIS.find(p => p.id === tipo)! : null;
  const instituicao = tipo === 'banco' || tipo === 'seguradora';
  const emailInstHint = 'Não são aceites emails pessoais (gmail, hotmail, outlook…).';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Painel lateral */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col overflow-hidden">
        <img src={teamCollab} alt="Equipa" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,.8) 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/"><img src={logoGiroDark} alt="Giro" className="h-14 object-contain" /></Link>
          <div>
            <h2 className="text-white font-bold leading-[1.05] tracking-tight mb-4" style={{ fontSize: 'clamp(2rem,3vw,2.75rem)' }}>
              Uma plataforma,<br /><span className="text-primary">quatro perfis.</span>
            </h2>
            <p className="text-white/75 max-w-sm leading-relaxed">
              Particulares, empresas, bancos e seguradoras no mesmo circuito de crédito,
              com cada passo registado.
            </p>
          </div>
          <p className="text-white/50 text-xs">Giro · Faktura Angola · NIF 5002964031</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/"><img src={logoGiroLight} alt="Giro" className="h-16 object-contain" /></Link>
          </div>

          {!perfil ? (
            <Fade key="escolha">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Que tipo de conta queres?</h1>
              <p className="text-muted-foreground mb-8">
                Escolhe o teu perfil. Só pedimos os dados que interessam.
              </p>
              <div className="space-y-3">
                {PERFIS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setTipo(p.id); setError(null); }}
                      className="group w-full flex items-center gap-4 text-left rounded-xl border border-border bg-background p-4 transition-all duration-300 hover:border-primary hover:shadow-md"
                    >
                      <div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{p.titulo}</p>
                        <p className="text-sm text-muted-foreground leading-snug">{p.descricao}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-8">
                Já tens conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
              </p>
            </Fade>
          ) : (
            <Fade key={tipo}>
              <button
                type="button"
                onClick={() => { setTipo(null); setError(null); }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Mudar tipo de conta
              </button>

              <h1 className="text-3xl font-bold tracking-tight mb-1.5">{perfil.titulo}</h1>
              <p className="text-muted-foreground mb-8">{perfil.descricao}</p>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {tipo === 'particular' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome completo *" />
                    <Par>
                      <Campo value={f.bi_numero ?? ''} onChange={set('bi_numero')} disabled={loading} id="bi_numero" label="BI / Documento *" placeholder="00XXXXXXXLA0XX" />
                      <Campo value={f.data_nascimento ?? ''} onChange={set('data_nascimento')} disabled={loading} id="data_nascimento" label="Data de nascimento" type="date" />
                    </Par>
                    <Par>
                      <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email *" type="email" />
                      <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    </Par>
                    <Campo value={f.morada ?? ''} onChange={set('morada')} disabled={loading} id="morada" label="Morada" placeholder="Rua, bairro, município, província" />
                  </>
                )}

                {tipo === 'empresa' && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label="Nome da empresa *" />
                    <Par>
                      <Campo value={f.nif ?? ''} onChange={set('nif')} disabled={loading} id="nif" label="NIF *" placeholder="5000000000" />
                      <Campo value={f.sector_actividade ?? ''} onChange={set('sector_actividade')} disabled={loading} id="sector_actividade" label="Sector de actividade *" placeholder="Comércio, serviços…" />
                    </Par>
                    <Campo value={f.morada ?? ''} onChange={set('morada')} disabled={loading} id="morada" label="Endereço da sede" />
                    <Par>
                      <Campo value={f.responsavel_nome ?? ''} onChange={set('responsavel_nome')} disabled={loading} id="responsavel_nome" label="Responsável *" />
                      <Campo value={f.responsavel_cargo ?? ''} onChange={set('responsavel_cargo')} disabled={loading} id="responsavel_cargo" label="Cargo" placeholder="Administrador, CFO…" />
                    </Par>
                    <Par>
                      <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email *" type="email" />
                      <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    </Par>
                    <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                      Depois de confirmares o email, submetes os teus ficheiros <strong className="text-foreground">SAF-T (AO)</strong> em{' '}
                      <strong className="text-foreground">Enviar SAF-T</strong> para gerar o teu Giro Score.
                    </p>
                  </>
                )}

                {instituicao && (
                  <>
                    <Campo value={f.nome ?? ''} onChange={set('nome')} disabled={loading} id="nome" label={tipo === 'banco' ? 'Nome da instituição *' : 'Nome da seguradora *'} />
                    <Par>
                      <Campo value={f.nif ?? ''} onChange={set('nif')} disabled={loading} id="nif" label={tipo === 'banco' ? 'NIF / nº de registo *' : 'NIF / nº de registo *'} />
                      <Campo value={f.licenca_numero ?? ''} onChange={set('licenca_numero')} disabled={loading} id="licenca_numero" label={tipo === 'banco' ? 'Licença do BNA *' : 'Licença da ARSEG *'} />
                    </Par>
                    <Campo value={f.responsavel_nome ?? ''} onChange={set('responsavel_nome')} disabled={loading} id="responsavel_nome" label={tipo === 'banco' ? 'Responsável de onboarding *' : 'Responsável *'} />
                    <Par>
                      <Campo value={f.email ?? ''} onChange={set('email')} disabled={loading} id="email" label="Email institucional *" type="email" placeholder={tipo === 'banco' ? 'nome@banco.ao' : 'nome@seguradora.ao'} />
                      <Campo value={f.telefone ?? ''} onChange={set('telefone')} disabled={loading} id="telefone" label="Telemóvel *" placeholder="+244 9XX XXX XXX" />
                    </Par>
                    <p className="-mt-3 text-xs text-muted-foreground">{emailInstHint}</p>

                    {tipo === 'banco' && (
                      <>
                        <Campo value={f.iban_institucional ?? ''} onChange={set('iban_institucional')} disabled={loading} id="iban_institucional" label="IBAN institucional *" placeholder="AO06 0000 0000 0000 0000 0000 0" />
                        <div className="space-y-1.5">
                          <Label htmlFor="integracao_contacto" className="text-sm font-medium">Contacto técnico para integração</Label>
                          <Textarea
                            id="integracao_contacto"
                            value={f.integracao_contacto ?? ''}
                            onChange={set('integracao_contacto')}
                            disabled={loading}
                            className="rounded-lg"
                            placeholder="Email da equipa técnica e URL de webhook para notificações"
                          />
                        </div>
                      </>
                    )}

                    {tipo === 'seguradora' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="produtos_seguro" className="text-sm font-medium">Produtos de seguro a oferecer *</Label>
                        <Textarea
                          id="produtos_seguro"
                          value={f.produtos_seguro ?? ''}
                          onChange={set('produtos_seguro')}
                          disabled={loading}
                          className="rounded-lg"
                          placeholder="Multirriscos, acidentes de trabalho, responsabilidade civil, automóvel…"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Palavra-passe *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 rounded-lg pr-10"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar conta
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left">
                  <Checkbox
                    id="accept-legal"
                    checked={legalAccepted}
                    onCheckedChange={checked => setLegalAccepted(checked === true)}
                    disabled={loading}
                    aria-required="true"
                    className="mt-0.5"
                  />
                  <Label htmlFor="accept-legal" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                    Li e aceito os{' '}
                    <Link to="/termos" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Termos e Condições</Link>
                    {' '}e a{' '}
                    <Link to="/privacidade" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Política de Privacidade</Link>.
                  </Label>
                </div>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Já tens conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
              </p>
            </Fade>
          )}
        </div>
      </div>
    </div>
  );
}