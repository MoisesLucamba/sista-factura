import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoFaktura from '@/assets/faktura-logo.svg';

export default function RecuperarId() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundId, setFoundId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('faktura_id, nome')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (qErr) throw qErr;
      if (!data || !data.faktura_id) {
        setError('Não encontrámos nenhuma conta com este email.');
        return;
      }

      setFoundId(data.faktura_id);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao procurar o teu ID. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, hsl(var(--background)), hsl(var(--muted)))',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'hsl(var(--card))',
        borderRadius: 16,
        border: '1px solid hsl(var(--border))',
        padding: '32px 28px',
        boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logoFaktura} alt="Faktura" style={{ height: 42, marginBottom: 16 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
            Recuperar Faktura ID
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
            Insere o teu email e enviamos o teu ID
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.1)', padding: '10px 12px', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                border: 'none',
                borderRadius: 10,
                padding: '12px',
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !email ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> A procurar...</> : 'Recuperar ID'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'hsl(var(--primary) / 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>
              O teu Faktura ID
            </h3>
            <div style={{
              fontSize: 24, fontWeight: 700, letterSpacing: 2,
              color: 'hsl(var(--primary))',
              padding: '14px',
              background: 'hsl(var(--primary) / 0.08)',
              borderRadius: 10,
              margin: '12px 0',
              fontFamily: 'monospace',
            }}>
              {foundId}
            </div>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 12 }}>
              Guarda este ID em local seguro. Vais precisar dele para entrar.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                marginTop: 18,
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                padding: '10px 22px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Ir para o login
            </Link>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'hsl(var(--muted-foreground))',
            textDecoration: 'none',
          }}>
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
