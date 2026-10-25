import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { BellRing, Loader2, MailCheck } from 'lucide-react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'a_enviar' | 'ok' | 'erro'>('idle');
  const [mensagem, setMensagem] = useState('');

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      setEstado('erro');
      setMensagem('Escreve um e-mail válido.');
      return;
    }
    setEstado('a_enviar');
    const { error } = await supabase
      .from('waitlist_leads')
      .insert({ email: valor, source: 'landing-prelancamento' });
    if (error) {
      if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
        setEstado('ok');
        setMensagem('Este e-mail já está na lista. Avisamos que estiveres.');
      } else {
        setEstado('erro');
        setMensagem('Não foi possível registar agora. Tenta daqui a pouco.');
      }
      return;
    }
    setEstado('ok');
    setMensagem('Ficas-te registado! Avisamos assim que a Papel arrancar.');
    setEmail('');
  };

  return (
    <form onSubmit={submeter} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (estado !== 'idle') setEstado('idle'); }}
          placeholder="O teu e-mail"
          className="h-12 flex-1"
          aria-label="E-mail para a lista de espera"
        />
        <Button type="submit" size="lg" className="h-12 px-6 font-bold gap-2" disabled={estado === 'a_enviar'}>
          {estado === 'a_enviar'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <BellRing className="w-4 h-4" />}
          Avisem-me
        </Button>
      </div>
      {mensagem && (
        <p className={`mt-3 text-sm flex items-center gap-1.5 ${estado === 'erro' ? 'text-destructive' : 'text-foreground'}`}>
          <MailCheck className={`w-4 h-4 ${estado === 'erro' ? 'hidden' : 'text-primary'}`} />
          {mensagem}
        </p>
      )}
    </form>
  );
}
