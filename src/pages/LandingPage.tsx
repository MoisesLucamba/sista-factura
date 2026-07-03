import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight, Clock, ShieldCheck, Building2, FileText, FolderArchive,
  Sparkles, CheckCircle2, Mail, Phone, MapPin, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logoFaktura from '@/assets/faktura-logo.png';

const ARQUIVOS_URL = 'https://arquivos.faktura.ao';
const NIF = '5002964031';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({ title: 'Email inválido', description: 'Introduza um email válido.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('waitlist_leads').insert({ email: email.trim().toLowerCase(), source: 'landing' });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes('duplicate')) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setDone(true);
    toast({ title: 'Registo confirmado', description: 'Entraremos em contacto assim que a plataforma abrir.' });
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-100">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">Obrigado. Vamos avisá-lo assim que a plataforma abrir em Julho de 2026.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
      <Input
        type="email"
        required
        placeholder="o.seu.email@empresa.ao"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-[#F5C518]"
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-12 px-6 font-bold bg-[#F5C518] text-[#0A1628] hover:bg-[#F5C518]/90"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registar interesse'}
      </Button>
    </form>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A1628] text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A1628]/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFaktura} alt="Faktura Angola" className="h-8 w-auto" />
            <span className="font-black tracking-tight text-lg hidden sm:inline">Faktura Angola</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#servicos" className="text-sm font-medium text-white/70 hover:text-white transition">Serviços</a>
            <a href="#porque" className="text-sm font-medium text-white/70 hover:text-white transition hidden sm:inline">Porquê nós</a>
            <a href="#contactos" className="text-sm font-medium text-white/70 hover:text-white transition hidden sm:inline">Contactos</a>
            <Link to="/login">
              <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-[#0A1628]">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Banner de aviso Faktura — plataforma em construção */}
      <div className="bg-gradient-to-r from-[#F5C518] to-[#f5a623] text-[#0A1628]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 font-black text-sm flex-shrink-0">
            <Clock className="w-4 h-4" />
            EM CONSTRUÇÃO
          </div>
          <p className="text-sm sm:text-base font-medium">
            A plataforma de faturação estará disponível no <strong>final de Julho de 2026</strong>. Registe o seu interesse e seja dos primeiros a aceder.
          </p>
        </div>
      </div>

      {/* Hero — identidade + missão */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #F5C518 0%, transparent 50%), radial-gradient(circle at 80% 60%, #F5C518 0%, transparent 45%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wide uppercase text-white/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#F5C518]" />
            Infra-estrutura económica nacional
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl mb-8">
            Construímos a infra-estrutura que{' '}
            <span className="text-[#F5C518]">formaliza a economia angolana</span>.
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-3xl leading-relaxed mb-10">
            A Faktura Angola não é apenas software. Nascemos para <strong className="text-white">organizar, digitalizar e formalizar</strong> a economia angolana, dando às empresas e instituições as ferramentas para operar com rigor, segurança e identidade própria num mercado em crescimento acelerado.
          </p>

          <div className="mb-6">
            <p className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">Lista de espera — plataforma de faturação</p>
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Serviços — Faktura & Arquivos */}
      <section id="servicos" className="py-24 bg-[#0D1A2E] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5C518] mb-3">Os nossos serviços</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Duas frentes, um propósito</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Faktura */}
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10">
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-[#F5C518]/20 text-[#F5C518] border border-[#F5C518]/30">
                Julho 2026
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center mb-5">
                <FileText className="w-7 h-7 text-[#F5C518]" />
              </div>
              <h3 className="text-2xl font-black mb-2">Faktura</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Plataforma de faturação electrónica certificada AGT — disponível em breve.
              </p>
              <Button disabled className="w-full h-11 font-bold bg-white/5 text-white/40 cursor-not-allowed">
                <Clock className="w-4 h-4 mr-2" /> Disponível em Julho de 2026
              </Button>
            </div>

            {/* Arquivos */}
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#F5C518]/[0.08] to-transparent border border-[#F5C518]/20">
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Activo
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center mb-5">
                <FolderArchive className="w-7 h-7 text-[#F5C518]" />
              </div>
              <h3 className="text-2xl font-black mb-2">Arquivos</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Gestão documental física e digital para empresas e instituições angolanas.
              </p>
              <a href={ARQUIVOS_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full h-11 font-bold bg-[#F5C518] text-[#0A1628] hover:bg-[#F5C518]/90">
                  Aceder Arquivos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Porquê a Faktura Angola? */}
      <section id="porque" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F5C518] mb-3">Porquê nós</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Porquê a Faktura Angola?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Building2,
                title: 'Formalização económica',
                desc: 'Damos às empresas as ferramentas para operar com rigor fiscal e transparência, contribuindo directamente para uma economia mais formal e produtiva.',
              },
              {
                Icon: ShieldCheck,
                title: 'Segurança documental',
                desc: 'Protegemos a informação crítica das organizações com protocolos rigorosos, penalizações contratuais e rastreabilidade total.',
              },
              {
                Icon: Sparkles,
                title: 'Tecnologia feita para Angola',
                desc: 'Construímos aqui, para a realidade angolana: certificação AGT, integração com Multicaixa e resposta às necessidades locais.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-7 bg-white/[0.03] border border-white/10 hover:border-[#F5C518]/30 transition">
                <div className="w-12 h-12 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-[#F5C518]" />
                </div>
                <h3 className="text-lg font-black mb-3">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer id="contactos" className="border-t border-white/10 bg-[#060F1E]">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoFaktura} alt="Faktura Angola" className="h-8 w-auto" />
                <span className="font-black">Faktura Angola</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Infra-estrutura económica nacional. Organizamos, digitalizamos e formalizamos a economia angolana.
              </p>
              <p className="mt-4 text-xs text-white/40"><strong className="text-white/60">NIF:</strong> {NIF}</p>
            </div>

            <div>
              <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-white/80">Serviços</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-white/60">Faktura — disponível em Julho de 2026</li>
                <li>
                  <a href={ARQUIVOS_URL} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#F5C518] inline-flex items-center gap-1">
                    Arquivos <ArrowRight className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-white/80">Contactos</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#F5C518]" /> +244 922 717 574</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#F5C518]" /> geral@faktura.ao</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#F5C518]" /> Luanda, Angola</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-white/40">
            <p>© {new Date().getFullYear()} Faktura Angola. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/termos-de-uso" className="hover:text-white transition">Termos</Link>
              <Link to="/politica-privacidade" className="hover:text-white transition">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
