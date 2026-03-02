import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Zap, Shield, BarChart3, FileText, Users, Globe,
  CheckCircle, ChevronRight, Sparkles, Clock, Play, HelpCircle,
  TrendingUp, UserPlus, Building2, BadgeDollarSign, ScanLine,
  Wallet, Repeat, MessageSquare, Smartphone, Mail, Code2, Webhook,
  Target, Heart, Coffee, Laptop, Briefcase, MapPin, BookOpen,
  AlertTriangle, Server, Key, RefreshCw, Lock, Eye, UserCheck,
  Bell, Phone, ExternalLink,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useState, useEffect, useRef } from 'react';
import logoFaktura from '@/assets/logo-faktura.png';
import heroBusiness from '@/assets/hero-business.jpg';
import dashboardPreview from '@/assets/dashboard-preview.png';
import logoOrbislink from '@/assets/logos/orbislink.png';
import logoCalmind from '@/assets/logos/calmind.png';
import logoPlaka from '@/assets/logos/plaka.jpg';
import logoAgrilink from '@/assets/logos/agrilink.png';
import logoAlphadata from '@/assets/logos/alphadata.png';
import teamCollab from '@/assets/team-collab.jpg';

/* ─── Hooks ─────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.5);
  const num = parseInt(value.replace(/\D/g, '')) || 0;
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1800, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, num]);
  const d = value.includes('+') ? count.toLocaleString() + '+' : value.includes('%') ? count + '%' : value.includes('/') ? value : String(count);
  return <span ref={ref}>{d}</span>;
}

function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useInView();
  const t = direction === 'up' ? 'translateY(36px)' : direction === 'left' ? 'translateX(-36px)' : direction === 'right' ? 'translateX(36px)' : 'translateY(-36px)';
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translate(0,0)' : t, transition: `opacity .7s cubic-bezier(.4,0,.2,1) ${delay}ms, transform .7s cubic-bezier(.4,0,.2,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Static data ─────────────────────────────────────────── */
const stats = [
  { value: '500+', label: 'Empresas Activas', icon: Users },
  { value: '50000+', label: 'Faturas Emitidas', icon: FileText },
  { value: '99', label: 'Uptime %', icon: TrendingUp },
  { value: '24', label: 'Suporte 24/7', icon: Clock },
];

const features = [
  {
    icon: FileText, title: 'Faturas Instantâneas',
    description: 'Emita faturas (FT), recibos (RC), proformas (PRO) e faturas-recibo (FR) em segundos. Todos com QR code, assinatura digital e numeração sequencial conforme AGT.',
    detail: 'Cada documento gerado inclui os campos obrigatórios por lei: NIF do emitente e receptor, data, descrição dos bens/serviços, valor base, IVA aplicável e valor total. Armazenamento automático por 5+ anos.',
  },
  {
    icon: Shield, title: 'Conformidade AGT 100%',
    description: 'Certificação digital, QR codes e assinaturas electrónicas em conformidade total com as normas da Administração Geral Tributária de Angola.',
    detail: 'Integração directa com o portal e-Fatura da AGT para validação automática. Nunca emita um documento inválido — a Faktura valida tudo antes de enviar.',
  },
  {
    icon: BarChart3, title: 'Relatórios Inteligentes',
    description: 'Dashboard completo com métricas em tempo real: facturação por período, clientes mais activos, documentos em aberto e tendências de crescimento.',
    detail: 'Exportação para Excel, PDF ou integração via API. Configure alertas automáticos para cobranças em atraso e relatórios mensais enviados por email.',
  },
  {
    icon: Users, title: 'Gestão de Clientes',
    description: 'Base de dados completa com histórico de transacções, contactos, NIF e padrões de compra. Com o programa ID, dados de compradores registados preenchem automaticamente.',
    detail: 'Segmente clientes por volume de compra, sector de actividade ou localização. Importe clientes em massa via CSV ou da sua base de dados existente.',
  },
  {
    icon: Globe, title: 'Multi-Canal de Envio',
    description: 'Envie facturas directamente por WhatsApp Business, SMS ou email com um clique. O cliente recebe o documento no canal que preferir.',
    detail: 'Templates personalizáveis com a sua marca. Confirmação de recepção em tempo real. Reenvio automático se o primeiro envio falhar.',
  },
  {
    icon: Clock, title: 'Automação Completa',
    description: 'Facturas recorrentes, lembretes de pagamento automáticos e relatórios mensais gerados sem intervenção manual.',
    detail: 'Configure regras: emitir factura no dia X de cada mês, enviar lembrete 5 dias após vencimento, marcar como pago quando receber confirmação Multicaixa.',
  },
];

const clientLogos = [
  { name: 'Orbis.Link', logo: logoOrbislink },
  { name: 'CalMind', logo: logoCalmind },
  { name: 'Plaka', logo: logoPlaka },
  { name: 'AgriLink', logo: logoAgrilink },
  { name: 'AlphaData', logo: logoAlphadata },
];

const faqs = [
  { q: 'Quais tipos de documentos posso emitir?', a: 'Pode emitir Fatura (FT) — documento fiscal oficial; Recibo (RC) — comprovante de pagamento; Proforma (PRO) — documento não fiscal que antecipa valores; e Fatura-Recibo (FR) — documento híbrido. Todos incluem QR code, assinatura digital e são válidos perante a AGT.' },
  { q: 'O que é faturação electrónica em Angola?', a: 'É o processo legal de emissão, envio e armazenamento de faturas em formato digital, conforme as normas da AGT. Permite maior eficiência, segurança e conformidade fiscal — e é cada vez mais obrigatório para empresas angolanas.' },
  { q: 'Posso enviar documentos pelo WhatsApp?', a: 'Sim! Configure a integração WhatsApp Business em 2 minutos e os seus clientes recebem faturas instantaneamente no telemóvel. Também disponível por SMS e email.' },
  { q: 'Como funciona o programa de ID de comprador?', a: 'O comprador regista-se gratuitamente e recebe um ID único (ex: M20XV). Ao fazer compras, partilha o ID — a empresa usa-o para preencher automaticamente os seus dados. Por cada fatura acima de 1.500 Kz emitida com o seu ID, recebe 50 Kz automaticamente na sua carteira Faktura.' },
  { q: 'Quais planos estão disponíveis?', a: 'Básico (7.500 Kz/mês ou 20.250 Kz/trimestre): até 100 faturas, funcionalidades essenciais. Completo (10.000 Kz/mês ou 27.000 Kz/trimestre): faturas ilimitadas, multi-canal, relatórios avançados. Empresa: preço sob medida para grandes volumes. Poupe 10% em qualquer plano trimestral.' },
  { q: 'É obrigatório armazenar as faturas?', a: 'Sim. Todos os documentos devem ser armazenados digitalmente por pelo menos 5 anos, conforme a legislação fiscal angolana. A Faktura faz isso automaticamente em nuvem segura.' },
  { q: 'A plataforma serve qualquer tipo de negócio?', a: 'Sim. A Faktura é adaptável para micro, pequenas e médias empresas de qualquer sector em Angola — comércio, serviços, restauração, tecnologia, saúde, construção e muito mais.' },
  { q: 'Existe suporte técnico?', a: 'Sim! Suporte disponível 24/7 por chat, email e telefone. O plano Completo inclui suporte prioritário com tempo de resposta garantido.' },
];

/* ─── Sub-page components (rendered inside main page via state) ── */

function SubPageShell({ children, title }) {
  useEffect(() => { window.scrollTo(0,0); }, []);
  return (
    <div className="min-h-screen pt-24 pb-24">
      {children}
    </div>
  );
}

/* ══ INTEGRAÇÕES ══════════════════════════════════════════ */
const integrations = [
  { category: 'Comunicação', items: [
    { icon: MessageSquare, name: 'WhatsApp Business', desc: 'Envie faturas e recibos directamente para o WhatsApp. Confirmação de leitura em tempo real.', status: 'Disponível' },
    { icon: Smartphone, name: 'SMS Angola', desc: 'Notificações automáticas via SMS para qualquer número angolano. Taxa de entrega >98%.', status: 'Disponível' },
    { icon: Mail, name: 'Email', desc: 'Envio por email com templates profissionais personalizáveis com a sua marca.', status: 'Disponível' },
  ]},
  { category: 'Fiscal & Governo', items: [
    { icon: Shield, name: 'AGT — Portal e-Fatura', desc: 'Integração directa com o portal fiscal da AGT para validação e submissão automática.', status: 'Disponível' },
    { icon: Globe, name: 'ERCA Angola', desc: 'Sincronização com o sistema de registo fiscal angolano para grandes contribuintes.', status: 'Em breve' },
  ]},
  { category: 'Pagamentos', items: [
    { icon: BarChart3, name: 'Multicaixa Express', desc: 'Aceite pagamentos por referência Multicaixa directamente na fatura. Confirmação automática.', status: 'Em breve' },
    { icon: Zap, name: 'Unitel Money', desc: 'Integração com carteira móvel Unitel para pagamentos instantâneos por telemóvel.', status: 'Em breve' },
    { icon: RefreshCw, name: 'Pagamentos Recorrentes', desc: 'Débito automático mensal para clientes com subscrições activas e serviços recorrentes.', status: 'Disponível' },
  ]},
  { category: 'Desenvolvimento', items: [
    { icon: Code2, name: 'REST API', desc: 'API completa com documentação detalhada para integrar a Faktura em qualquer sistema.', status: 'Disponível' },
    { icon: Webhook, name: 'Webhooks', desc: 'Notificações em tempo real sobre qualquer evento: fatura emitida, paga, enviada.', status: 'Disponível' },
  ]},
];

function PageIntegracoes() {
  return (
    <SubPageShell title="Integrações">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Integrações</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Conecte ao seu <span className="shimmer-text">ecossistema</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            WhatsApp, AGT, Multicaixa, API — tudo integrado numa só plataforma.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {integrations.map(({ category, items }) => (
          <div key={category} className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black">{category}</h2>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(({ icon: Icon, name, desc, status }) => (
                <div key={name} className="bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-accent rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/15 rounded-full px-4 py-1.5 mb-4">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-accent-foreground">Para Developers</span>
              </div>
              <h2 className="text-3xl font-black text-accent-foreground mb-4">Construa com a nossa API</h2>
              <p className="text-accent-foreground/60 text-sm leading-relaxed">REST API completa, SDKs, webhooks e documentação interactiva. Integre faturação em qualquer sistema em horas, não semanas.</p>
            </div>
            <div className="bg-accent-foreground/5 rounded-2xl p-6 border border-accent-foreground/10 font-mono text-sm">
              <p className="text-accent-foreground/40 mb-2"># Emitir fatura via API</p>
              <p className="text-primary font-bold">POST https://api.faktura.ao/v1/faturas</p>
              <div className="mt-4 space-y-1 text-accent-foreground/60 text-xs">
                <p><span className="text-primary">"cliente_id"</span>: <span className="text-amber-400">"M20XV"</span></p>
                <p><span className="text-primary">"valor"</span>: <span className="text-blue-400">25000</span></p>
                <p><span className="text-primary">"descricao"</span>: <span className="text-amber-400">"Servico de consultoria"</span></p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-green-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>200 OK — FT 2025/1284 emitida</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ SOBRE NÓS ══════════════════════════════════════════ */
const teamMembers = [
  { name: 'Carlos Mendes', role: 'CEO & Co-fundador', init: 'CM', color: 'bg-blue-100 text-blue-700' },
  { name: 'Ana Ferreira', role: 'CTO & Co-fundadora', init: 'AF', color: 'bg-purple-100 text-purple-700' },
  { name: 'Pedro Santos', role: 'Head of Product', init: 'PS', color: 'bg-green-100 text-green-700' },
  { name: 'Sofia Lopes', role: 'Head of Design', init: 'SL', color: 'bg-amber-100 text-amber-700' },
  { name: 'Miguel Costa', role: 'Lead Engineer', init: 'MC', color: 'bg-rose-100 text-rose-700' },
  { name: 'Beatriz Neto', role: 'Head of Sales', init: 'BN', color: 'bg-teal-100 text-teal-700' },
];
const milestones = [
  { year: '2022', t: 'Fundação', d: 'A Faktura nasceu em Luanda com a missão de modernizar a faturação em Angola.' },
  { year: '2023', t: 'Primeiro produto', d: 'Lançamento da plataforma com integração AGT e envio por WhatsApp.' },
  { year: '2024', t: 'Crescimento', d: 'Ultrapassámos 500 empresas activas e 50.000 faturas emitidas.' },
  { year: '2025', t: 'Ecossistema', d: 'Lançamento do programa de compradores com ID único e recompensas por fatura.' },
];

function PageSobreNos() {
  return (
    <SubPageShell title="Sobre Nós">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Sobre Nós</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6">Feitos em Angola, <span className="shimmer-text">para Angola</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A Faktura nasceu da frustração de ver empresas angolanas a perder horas em faturação manual. Decidimos resolver isso de uma vez por todas.
          </p>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-5">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">A nossa missão</span>
              </div>
              <h2 className="text-3xl font-black mb-5 tracking-tight">Simplificar a faturação para cada empresa angolana</h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-sm">Acreditamos que nenhuma empresa deve falhar por causa de burocracia fiscal. A nossa missão é tornar a faturação tão simples que qualquer pessoa — com ou sem formação contabilística — consiga emitir documentos legais em segundos.</p>
              <p className="text-muted-foreground leading-relaxed text-sm">Combinamos tecnologia moderna com profundo conhecimento da legislação angolana para criar uma plataforma que protege o seu negócio e liberta o seu tempo.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['500+','Empresas activas',Users],['50K+','Faturas emitidas',FileText],['99%','Uptime garantido',TrendingUp],['2022','Fundada em Luanda',Heart]].map(([v,l,I],i) => (
                <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 text-center group hover:border-primary/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <I className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-black mb-0.5">{v}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-10">A nossa história</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {milestones.map(({ year, t, d }) => (
                <div key={year} className="relative flex gap-6 items-start">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/20 transition-colors">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">{year}</span>
                    <h3 className="font-bold text-lg mt-1 mb-1">{t}</h3>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-10">A nossa equipa</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamMembers.map(({ name, role, init, color }) => (
              <div key={name} className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group">
                <div className={`w-13 h-13 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
                  {init}
                </div>
                <div>
                  <p className="font-bold">{name}</p>
                  <p className="text-sm text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ BLOG ══════════════════════════════════════════════ */
const blogPosts = [
  { cat: 'Faturação', tag: true, title: 'O que mudou na faturação electrónica em Angola em 2025', excerpt: 'A AGT reforçou os requisitos para emissão de faturas digitais. Veja o que mudou e como a Faktura já cumpre todos os novos critérios.', author: 'Equipa Faktura', date: '15 Jan 2025', read: '6 min', init: 'EF', c: 'bg-primary/15 text-primary' },
  { cat: 'Dicas', title: 'Como evitar os 5 erros mais comuns na emissão de faturas', excerpt: 'Erros simples podem causar problemas sérios com o fisco. Descubra quais são e como a Faktura os elimina automaticamente.', author: 'Carlos Mendes', date: '8 Jan 2025', read: '4 min', init: 'CM', c: 'bg-blue-100 text-blue-700' },
  { cat: 'Produto', title: 'Novo: ID de comprador — ganhe 50 Kz por cada fatura', excerpt: 'Registe-se, partilhe o seu ID e receba automaticamente 50 Kz por cada compra faturada acima de 1.500 Kz.', author: 'Ana Ferreira', date: '2 Jan 2025', read: '3 min', init: 'AF', c: 'bg-purple-100 text-purple-700' },
  { cat: 'Negócio', title: 'Faturação recorrente: automatize cobranças mensais', excerpt: 'Se tem clientes com serviços mensais, a faturação recorrente da Faktura vai poupar horas de trabalho repetitivo.', author: 'Pedro Santos', date: '28 Dez 2024', read: '5 min', init: 'PS', c: 'bg-green-100 text-green-700' },
  { cat: 'Conformidade', title: 'Guia completo: NIF, IBAN e dados obrigatórios na fatura', excerpt: 'Saiba exactamente quais campos são legalmente obrigatórios e como preenchê-los correctamente.', author: 'Beatriz Neto', date: '20 Dez 2024', read: '7 min', init: 'BN', c: 'bg-teal-100 text-teal-700' },
  { cat: 'Integrações', title: 'Como enviar faturas pelo WhatsApp automaticamente', excerpt: 'Configure a integração WhatsApp Business em 2 minutos e os seus clientes recebem faturas no telemóvel.', author: 'Miguel Costa', date: '15 Dez 2024', read: '4 min', init: 'MC', c: 'bg-rose-100 text-rose-700' },
];
const catColors = { Faturação:'bg-primary/10 text-primary', Dicas:'bg-blue-100 text-blue-700', Produto:'bg-purple-100 text-purple-700', Negócio:'bg-green-100 text-green-700', Conformidade:'bg-teal-100 text-teal-700', Integrações:'bg-amber-100 text-amber-700' };

function PageBlog() {
  return (
    <SubPageShell title="Blog">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Blog Faktura</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-4">Recursos & <span className="shimmer-text">Insights</span></h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">Dicas de faturação, novidades e guias práticos para empresas angolanas.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10 mb-10 group cursor-pointer hover:border-primary/25 hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">{blogPosts[0].cat}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground">Destaque</span>
              </div>
              <h2 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors leading-tight">{blogPosts[0].title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{blogPosts[0].excerpt}</p>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-primary/15 text-primary">{blogPosts[0].init}</div>
                <span className="text-sm font-semibold">{blogPosts[0].author}</span>
                <span className="text-muted-foreground text-sm">· {blogPosts[0].date}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Clock className="w-3.5 h-3.5" />{blogPosts[0].read}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl h-48 flex items-center justify-center border border-primary/15">
              <BookOpen className="w-14 h-14 text-primary/30" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogPosts.slice(1).map((p) => (
            <div key={p.title} className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col group cursor-pointer hover:border-primary/25 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${catColors[p.cat]}`}>{p.cat}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{p.read}</div>
              </div>
              <h3 className="font-bold text-lg mb-2 flex-1 group-hover:text-primary transition-colors leading-snug">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.excerpt}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.c}`}>{p.init}</div>
                <div className="text-xs min-w-0">
                  <p className="font-semibold truncate">{p.author}</p>
                  <p className="text-muted-foreground">{p.date}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SubPageShell>
  );
}

/* ══ CARREIRAS ══════════════════════════════════════════ */
const perks2 = [
  { icon: Laptop, t: 'Remote-first', d: 'Trabalhe de qualquer lugar em Angola.' },
  { icon: TrendingUp, t: 'Crescimento', d: 'Plano de carreira claro e revisões salariais.' },
  { icon: Heart, t: 'Saúde', d: 'Seguro de saúde para si e família.' },
  { icon: Coffee, t: 'Cultura', d: 'Equipa jovem, missão real, impacto imediato.' },
  { icon: Globe, t: 'Impacto', d: 'O seu trabalho afecta centenas de empresas.' },
  { icon: Zap, t: 'Stack moderno', d: 'React, Node, Supabase, Postgres.' },
];
const jobs = [
  { title: 'Engenheiro(a) Full-Stack', dept: 'Engineering', loc: 'Luanda / Remoto', tags: ['React','TypeScript','Node.js'], desc: 'Construa funcionalidades que milhares de empresas angolanas usam todos os dias.', c: 'bg-blue-100 text-blue-700' },
  { title: 'Product Designer', dept: 'Design', loc: 'Luanda / Remoto', tags: ['Figma','UX Research'], desc: 'Desenhe experiências que tornam a faturação simples para qualquer empresário.', c: 'bg-purple-100 text-purple-700' },
  { title: 'Account Executive', dept: 'Sales', loc: 'Luanda', tags: ['B2B','CRM'], desc: 'Apresente a Faktura a empresas e ajude-as a modernizar a sua faturação.', c: 'bg-green-100 text-green-700' },
  { title: 'Customer Success Manager', dept: 'Operations', loc: 'Luanda / Remoto', tags: ['Suporte','Onboarding'], desc: 'Garanta que os clientes tiram o máximo da plataforma.', c: 'bg-amber-100 text-amber-700' },
];

function PageCarreiras() {
  return (
    <SubPageShell title="Carreiras">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Carreiras</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6">Construa Angola <span className="shimmer-text">connosco</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Procuramos pessoas talentosas para ajudar a modernizar a faturação em Angola.</p>
        </div>
      </section>

      <section className="py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-center mb-8">Porque a Faktura?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks2.map(({ icon: I, t, d }) => (
              <div key={t} className="bg-card border border-border/50 rounded-2xl p-5 flex items-start gap-4 group hover:border-primary/25 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <I className="w-5 h-5 text-primary" />
                </div>
                <div><p className="font-bold mb-1">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-2">Vagas <span className="shimmer-text">abertas</span></h2>
            <p className="text-muted-foreground">{jobs.length} posições disponíveis</p>
          </div>
          <div className="space-y-4">
            {jobs.map((j) => (
              <div key={j.title} className="bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${j.c}`}>{j.dept}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{j.loc}</div>
                    </div>
                    <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{j.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{j.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {j.tags.map(t => <span key={t} className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium">{t}</span>)}
                    </div>
                  </div>
                  <Button className="flex-shrink-0 font-bold gap-2">Candidatar <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-muted/40 border border-border/50 rounded-2xl p-7 text-center">
            <h3 className="font-black text-xl mb-2">Não encontrou a vaga certa?</h3>
            <p className="text-muted-foreground text-sm mb-4">Envie uma candidatura espontânea. Se tiver talento, queremos conhecê-lo.</p>
            <Button variant="outline" className="font-bold border-2 hover:bg-primary/5 hover:border-primary/40 transition-all gap-2">Candidatura espontânea <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ TERMOS ══════════════════════════════════════════════ */
const termosSections = [
  { t: '1. Aceitação dos Termos', c: 'Ao aceder ou utilizar a plataforma Faktura ("Serviço"), concorda em ficar vinculado a estes Termos de Uso. Se não concordar, não poderá aceder ao Serviço. Estes Termos aplicam-se a todos os utilizadores, incluindo empresas e compradores individuais registados.' },
  { t: '2. Descrição do Serviço', c: 'A Faktura é uma plataforma de faturação electrónica que permite: emissão de faturas, recibos, proformas e faturas-recibo em conformidade com a AGT; gestão de clientes e histórico de transacções; envio automatizado por WhatsApp, SMS e email; programa de compradores com ID único e recompensas por fatura; e relatórios e análises financeiras.' },
  { t: '3. Conta de Utilizador', c: 'Para utilizar o Serviço, deve criar uma conta com informações verdadeiras e completas. É responsável pela confidencialidade das suas credenciais e por todas as actividades na sua conta. Deve notificar-nos imediatamente em caso de acesso não autorizado.' },
  { t: '4. Programa de Compradores (ID de Compra)', c: 'Ao registar-se como comprador, receberá um ID único. Este ID permite que empresas utilizadoras da Faktura preencham automaticamente os seus dados em faturas, com autorização expressa. O comprador recebe 50 Kz por cada fatura emitida acima de 1.500 Kz com o seu ID. A Faktura pode alterar os valores com aviso prévio de 30 dias.' },
  { t: '5. Obrigações do Utilizador', c: 'O utilizador compromete-se a: fornecer informações verídicas; usar o Serviço apenas para fins legais; não aceder a dados de outros utilizadores sem autorização; não emitir documentos falsos ou fraudulentos; manter a confidencialidade de dados de terceiros; e cumprir todas as obrigações fiscais.' },
  { t: '6. Pagamentos e Subscrições', c: 'O Serviço é oferecido em planos de subscrição mensal ou trimestral. Os pagamentos são processados antecipadamente. Não são emitidos reembolsos por períodos parcialmente utilizados, salvo nos casos previstos na legislação angolana do consumidor. A Faktura pode alterar os preços com aviso prévio de 30 dias.' },
  { t: '7. Conformidade Fiscal', c: 'A Faktura facilita a emissão de documentos fiscais em conformidade com a AGT, mas não substitui o aconselhamento de um contabilista certificado. O utilizador é o único responsável pela correcta classificação fiscal das suas transacções.' },
  { t: '8. Propriedade Intelectual', c: 'O Serviço, incluindo software, design, textos e logótipos, é propriedade exclusiva da Faktura Angola Lda. e está protegido por legislação de propriedade intelectual. Os dados introduzidos pelo utilizador permanecem sua propriedade.' },
  { t: '9. Limitação de Responsabilidade', c: 'Na máxima extensão permitida pela lei angolana, a Faktura não será responsável por danos indirectos, incidentais, especiais ou consequenciais resultantes do uso ou impossibilidade de uso do Serviço.' },
  { t: '10. Rescisão', c: 'Pode cancelar a sua conta a qualquer momento, com efeito no final do período de subscrição pago. Após a rescisão, pode solicitar exportação dos seus dados no prazo de 90 dias.' },
  { t: '11. Lei Aplicável', c: 'Estes Termos são regidos pela legislação da República de Angola. Qualquer litígio será submetido à jurisdição exclusiva dos tribunais angolanos competentes.' },
  { t: '12. Contacto', c: 'Para questões sobre estes Termos, contacte: legal@faktura.ao | Luanda, Angola.' },
];

function PageTermos() {
  return (
    <SubPageShell title="Termos">
      <section className="relative py-20 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Legal</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground">Ultima actualizacao: <strong>1 de Janeiro de 2025</strong></p>
        </div>
      </section>
      <section className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-muted/40 border border-border/50 rounded-2xl p-5 mb-10">
          <p className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">Indice</p>
          <ul className="space-y-1.5">
            {termosSections.map(({t}) => (
              <li key={t}><a href={"#t-"+t.replace(/[^a-z0-9]/gi,'-').toLowerCase()} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{t}</a></li>
            ))}
          </ul>
        </div>
        <div className="space-y-8">
          {termosSections.map(({ t, c }) => (
            <div key={t} id={"t-"+t.replace(/[^a-z0-9]/gi,'-').toLowerCase()} className="scroll-mt-24">
              <h2 className="text-xl font-black mb-3">{t}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{c}</p>
              <div className="mt-7 h-px bg-border/40" />
            </div>
          ))}
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ PRIVACIDADE ══════════════════════════════════════════ */
const privSections = [
  { t: '1. Responsavel pelo Tratamento', c: 'A Faktura Angola Lda. é o responsável pelo tratamento dos seus dados pessoais, com sede em Luanda, Angola. Contacto: privacidade@faktura.ao' },
  { t: '2. Dados que Recolhemos', c: 'Dados de conta: nome completo, email, telefone, NIF. Dados de utilizacao: faturas emitidas, historico de sessoes, IP e dispositivo. Dados de compradores: nome parcialmente visivel, NIF e telefone mascarados, historico de faturas associadas ao ID.' },
  { t: '3. Como Usamos os Seus Dados', c: 'Para prestar o servico de faturacao; cumprir obrigacoes legais e fiscais (AGT); comunicar sobre a sua conta; melhorar a plataforma; processar recompensas do programa de compradores; prevenir fraude e garantir seguranca.' },
  { t: '4. Base Legal', c: 'Execucao do contrato (prestar o servico); obrigacao legal (AGT); consentimento (marketing e programa de compradores); interesse legitimo (seguranca e prevencao de fraude).' },
  { t: '5. Partilha de Dados', c: 'Nao vendemos os seus dados. Partilhamos apenas com parceiros essenciais ao servico, a AGT quando legalmente obrigatorio, e no programa de compradores com dados mascarados e com consentimento explicito.' },
  { t: '6. Retencao de Dados', c: 'Conservamos os dados pelo tempo necessario para o servico e obrigacoes fiscais (minimo 5 anos). Apos cancelamento da conta, os dados sao anonimizados ou eliminados em 90 dias.' },
  { t: '7. Os Seus Direitos', c: 'Tem direito a: acesso, rectificacao, eliminacao (sujeito a obrigacoes legais), portabilidade, oposicao a marketing, e retirar consentimento a qualquer momento. Contacto: privacidade@faktura.ao' },
  { t: '8. Seguranca', c: 'Encriptacao TLS/SSL em transito, AES-256 em repouso, controlo de acesso por funcoes (RBAC), monitorizacao continua e plano de resposta a incidentes. Em caso de violacao, sera notificado em 72 horas.' },
  { t: '9. Cookies e Alteracoes', c: 'Usamos cookies essenciais para autenticacao e cookies analiticos com consentimento. Alteracoes a esta politica sao comunicadas por email com 15 dias de antecedencia. Contacto: privacidade@faktura.ao' },
];

const privHighlights = [
  { icon: Eye, t: 'Transparencia total', d: 'Sabemos que dados recolhemos e dizemo-lo claramente.' },
  { icon: Lock, t: 'Dados encriptados', d: 'TLS e AES-256 em todos os dados.' },
  { icon: UserCheck, t: 'Controlo seu', d: 'Aceda, corrija ou elimine a qualquer momento.' },
  { icon: Bell, t: 'Sem spam', d: 'Nunca vendemos os seus dados.' },
];

function PagePrivacidade() {
  return (
    <SubPageShell title="Privacidade">
      <section className="relative py-20 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Privacidade</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-4">Politica de Privacidade</h1>
          <p className="text-muted-foreground">Ultima actualizacao: <strong>1 de Janeiro de 2025</strong></p>
        </div>
      </section>
      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {privHighlights.map(({icon:I,t,d}) => (
            <div key={t} className="bg-card border border-border/50 rounded-2xl p-5 text-center group hover:border-primary/25 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <I className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-sm mb-1">{t}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {privSections.map(({ t, c }) => (
            <div key={t}>
              <h2 className="text-xl font-black mb-3">{t}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{c}</p>
              <div className="mt-7 h-px bg-border/40" />
            </div>
          ))}
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ SEGURANCA ══════════════════════════════════════════ */
const secPillars = [
  { icon: Lock, t: 'Encriptacao de Ponta a Ponta', d: 'TLS 1.3 em transito e AES-256 em repouso. Os seus dados nunca viajam ou ficam guardados sem proteccao.', badge: 'TLS 1.3 + AES-256' },
  { icon: Server, t: 'Infraestrutura Segura', d: 'Infraestrutura certificada ISO 27001. Backups automaticos diarios com retencao de 30 dias.', badge: 'ISO 27001' },
  { icon: Key, t: 'Autenticacao Robusta', d: 'Suporte a 2FA. Sessoes com expiracao automatica e deteccao de acessos suspeitos em tempo real.', badge: '2FA' },
  { icon: Eye, t: 'Monitorizacao 24/7', d: 'Sistemas monitorizados continuamente. Qualquer actividade anomala e detectada e tratada imediatamente.', badge: '24/7' },
  { icon: UserCheck, t: 'Controlo de Acesso', d: 'Arquitectura RBAC: cada utilizador acede apenas aos dados que lhe competem. Zero acesso privilegiado desnecessario.', badge: 'RBAC' },
  { icon: RefreshCw, t: 'Actualizacoes de Seguranca', d: 'Patches criticos aplicados em menos de 24 horas. Testes de penetracao semestrais por terceiros certificados.', badge: 'Patch < 24h' },
];
const secPractices = [
  'Passwords nunca armazenadas em texto simples — hashing bcrypt',
  'NIF e telefone parcialmente mascarados em visualizacoes partilhadas',
  'Logs de auditoria completos para todas as operacoes criticas',
  'Testes de penetracao por terceiros semestralmente',
  'Plano de recuperacao de desastres testado trimestralmente',
  'Conformidade com OWASP Top 10 em todo o codigo',
  'Revisao de seguranca obrigatoria em cada funcionalidade nova',
  'Programa de bug bounty para reporte responsavel de vulnerabilidades',
];

function PageSeguranca() {
  return (
    <SubPageShell title="Seguranca">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-6">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Seguranca</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6">Os seus dados estao <span className="shimmer-text">sempre protegidos</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">A seguranca e a fundacao de tudo o que construimos. Nao e uma funcionalidade — e um compromisso.</p>
        </div>
      </section>

      <section className="py-4 bg-green-50 dark:bg-green-950/20 border-y border-green-100 dark:border-green-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-green-700 dark:text-green-400">Todos os sistemas operacionais</span>
          <span className="text-sm text-green-600/60">— Uptime 99.9% nos ultimos 90 dias</span>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Pilares de seguranca</h2>
            <p className="text-muted-foreground">As camadas que protegem os seus dados</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {secPillars.map(({ icon: I, t, d, badge }) => (
              <div key={t} className="bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/25 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <I className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full">{badge}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-10">Boas praticas que seguimos</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {secPractices.map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border border-border/50 rounded-xl p-4 hover:border-primary/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-3xl p-8 hover:border-primary/25 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black mb-3">Encontrou uma vulnerabilidade?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">Trabalhamos com a comunidade de seguranca. Reporte de forma responsavel e reconhecemos a sua contribuicao — resposta em ate 48 horas.</p>
            <Button variant="outline" className="font-bold border-2 hover:bg-primary/5 hover:border-primary/40 gap-2">Reportar vulnerabilidade <ArrowRight className="w-4 h-4" /></Button>
          </div>
          <div className="bg-accent rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-accent-foreground mb-3">Equipa de Seguranca</h3>
              <p className="text-accent-foreground/60 text-sm mb-5">Para incidentes urgentes que afectem os seus dados, contacte directamente.</p>
              <div className="space-y-3">
                <div className="bg-accent-foreground/5 rounded-xl p-3 border border-accent-foreground/10">
                  <p className="text-xs text-accent-foreground/40 font-semibold uppercase tracking-wider">Email de seguranca</p>
                  <p className="text-accent-foreground font-bold text-sm mt-0.5">seguranca@faktura.ao</p>
                </div>
                <div className="bg-accent-foreground/5 rounded-xl p-3 border border-accent-foreground/10">
                  <p className="text-xs text-accent-foreground/40 font-semibold uppercase tracking-wider">Tempo de resposta</p>
                  <p className="text-accent-foreground font-bold text-sm mt-0.5">Ate 24 horas (incidentes criticos)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageShell>
  );
}

/* ══ MAIN LANDING PAGE ══════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activePage, setActivePage] = useState(null); // null = landing
  const [expandedFeature, setExpandedFeature] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onMouse = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouse);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse); };
  }, []);

  useEffect(() => {
    if (activePage) window.scrollTo(0, 0);
  }, [activePage]);

  const navLinks = [
    ['#features', 'Funcionalidades', null],
    ['#ecosystem', 'Ecossistema', null],
    ['#pricing', 'Precos', null],
    ['#faq', 'FAQ', null],
    ['integracoes', 'Integracoes', 'integracoes'],
  ];

  const footerLinks = {
    'Produto': [['#features','Funcionalidades',null],['#pricing','Precos',null],['integracoes','Integracoes','integracoes']],
    'Empresa': [['sobre','Sobre Nos','sobre'],['blog','Blog','blog'],['carreiras','Carreiras','carreiras']],
    'Legal': [['termos','Termos de Uso','termos'],['privacidade','Privacidade','privacidade'],['seguranca','Seguranca','seguranca']],
  };

  function NavLink({ label, page }) {
    if (page) return (
      <button onClick={() => setActivePage(page)} className="nav-link text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">{label}</button>
    );
    return (
      <a href={"#"+label.toLowerCase()} onClick={() => setActivePage(null)} className="nav-link text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">{label}</a>
    );
  }

  function renderSubPage() {
    if (activePage === 'integracoes') return <PageIntegracoes />;
    if (activePage === 'sobre') return <PageSobreNos />;
    if (activePage === 'blog') return <PageBlog />;
    if (activePage === 'carreiras') return <PageCarreiras />;
    if (activePage === 'termos') return <PageTermos />;
    if (activePage === 'privacidade') return <PagePrivacidade />;
    if (activePage === 'seguranca') return <PageSeguranca />;
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.4} 100%{transform:scale(1.9);opacity:0} }
        @keyframes scroll-x { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes slide-left { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slide-right { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 24px hsl(var(--primary)/.3)} 50%{box-shadow:0 0 60px hsl(var(--primary)/.6),0 0 120px hsl(var(--primary)/.15)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes marquee-slow { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes bounce-subtle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fade-scale { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes lema-appear { 0%{opacity:0;transform:translateY(60px) scale(.9)} 60%{opacity:1;transform:translateY(-8px) scale(1.02)} 100%{transform:translateY(0) scale(1)} }

        .af { animation: float 4s ease-in-out infinite; }
        .af2 { animation: float2 6s ease-in-out infinite; }
        .af3 { animation: float 5s ease-in-out 1.5s infinite; }
        .asx { animation: scroll-x 28s linear infinite; }
        .ag { animation: glow-pulse 3s ease-in-out infinite; }
        .ab { animation: bounce-subtle 2.5s ease-in-out infinite; }

        .hero1 { animation: slide-left .9s cubic-bezier(.4,0,.2,1) .15s both; }
        .hero2 { animation: slide-left .9s cubic-bezier(.4,0,.2,1) .35s both; }
        .hero3 { animation: slide-left .9s cubic-bezier(.4,0,.2,1) .55s both; }
        .heroS { animation: slide-up .8s cubic-bezier(.4,0,.2,1) .65s both; }
        .heroC { animation: slide-up .8s cubic-bezier(.4,0,.2,1) .85s both; }
        .heroSt { animation: slide-up .8s cubic-bezier(.4,0,.2,1) 1.05s both; }
        .heroB { animation: slide-up .7s cubic-bezier(.4,0,.2,1) .05s both; }
        .heroI { animation: slide-right 1s cubic-bezier(.4,0,.2,1) .3s both; }

        .shimmer-text {
          background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/.55) 40%, hsl(var(--primary)) 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .shimmer-text-white {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,.6) 40%, #fff 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .nav-link { position:relative; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:hsl(var(--primary)); border-radius:99px; transition:width .3s ease; }
        .nav-link:hover::after { width:100%; }
        .pulse-ring::before { content:''; position:absolute; inset:-6px; border-radius:inherit; border:2px solid hsl(var(--primary)/.4); animation:pulse-ring 2s ease-out infinite; }
        .fc { transition: all .35s cubic-bezier(.4,0,.2,1); }
        .fc:hover { transform: translateY(-8px) scale(1.02); }
        .fc:hover .fi { transform: rotate(-6deg) scale(1.15); }
        .fi { transition: transform .35s cubic-bezier(.34,1.56,.64,1); }
        .pc { transition: all .4s cubic-bezier(.4,0,.2,1); }
        .pc:hover { transform: translateY(-6px); }
        .ec { transition: all .3s cubic-bezier(.4,0,.2,1); }
        .ec:hover { transform: translateY(-6px); box-shadow: 0 20px 48px hsl(var(--primary)/.12); }
        .btn-glow:hover { box-shadow: 0 8px 32px hsl(var(--primary)/.45) !important; }
        .id-badge { font-family: 'Courier New', monospace; letter-spacing: .15em; }

        .lema-section {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/.7) 100%);
          position: relative;
          overflow: hidden;
        }
        .lema-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 50%, rgba(255,255,255,.08) 0%, transparent 60%);
        }
        .lema-text {
          font-size: clamp(2.5rem, 8vw, 7rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
          animation: lema-appear 1s cubic-bezier(.34,1.56,.64,1) .1s both;
        }
        .lema-sub {
          animation: lema-appear 1s cubic-bezier(.34,1.56,.64,1) .3s both;
        }
        .ticker-wrap { overflow: hidden; }
        .ticker-inner { display: flex; width: max-content; animation: ticker 20s linear infinite; }

        .page-transition { animation: fade-scale .4s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-background/92 backdrop-blur-2xl shadow-lg shadow-black/5 border-b border-border/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setActivePage(null)} className="flex-shrink-0">
              <img src={logoFaktura} alt="Faktura" className="h-9 object-contain" />
            </button>
            <div className="hidden md:flex items-center gap-7">
              {activePage ? (
                <button onClick={() => setActivePage(null)} className="nav-link text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Inicio
                </button>
              ) : (
                [['features','Funcionalidades'],['ecosystem','Ecossistema'],['pricing','Precos'],['faq','FAQ']].map(([h,l]) => (
                  <a key={h} href={"#"+h} className="nav-link text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                ))
              )}
              <button onClick={() => setActivePage('integracoes')} className={`nav-link text-sm font-semibold transition-colors ${activePage==='integracoes' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Integracoes</button>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login"><Button variant="ghost" className="font-semibold hover:bg-primary/10">Entrar</Button></Link>
              <Link to="/registar"><Button className="font-bold shadow-lg shadow-primary/25 btn-glow hover:scale-105 transition-all">Comecar Gratis</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SUB PAGE or MAIN LANDING ── */}
      {activePage ? (
        <div className="page-transition">
          {renderSubPage()}
        </div>
      ) : (
        <>
          {/* ── HERO ── */}
          <section className="relative pt-24 pb-0 lg:pt-32 overflow-hidden min-h-[80vh] flex items-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-[700px] h-[700px] bg-primary/8 rounded-full blur-[130px] transition-all duration-[3000ms] ease-out" style={{ top:'5%', left:`${20+mousePos.x*8}%`, transform:'translate(-50%,-50%)' }} />
              <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] transition-all duration-[4000ms] ease-out" style={{ bottom:'10%', right:`${15+(1-mousePos.x)*8}%` }} />
              <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage:'linear-gradient(hsl(var(--foreground)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--foreground)) 1px,transparent 1px)', backgroundSize:'80px 80px' }} />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="heroB inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-5 py-2 mb-8 cursor-default hover:bg-primary/15 transition-colors">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-bold">A plataforma #1 de Angola</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="mb-6 leading-[0.92]">
                    <h1 className="text-5xl sm:text-6xl lg:text-[5.2rem] font-black tracking-tight">
                      <span className="hero1 block">Faturacao que</span>
                      <span className="hero2 block"><span className="shimmer-text">impulsiona</span> <span className="text-foreground">✦</span></span>
                      <span className="hero3 block">o seu negocio</span>
                    </h1>
                  </div>
                  <p className="heroS text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                    Emita faturas profissionais, gerencie clientes e mantenha-se em conformidade com a AGT — tudo num so lugar.
                  </p>
                  <div className="heroC flex flex-col sm:flex-row items-start gap-4 mb-10">
                    <Link to="/registar">
                      <Button size="lg" className="h-14 px-8 text-lg font-black shadow-2xl shadow-primary/30 btn-glow hover:scale-105 transition-all group gap-2">
                        Comecar Gratis <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                      </Button>
                    </Link>
                    <a href="#features">
                      <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2 gap-2 hover:bg-primary/5 hover:border-primary/50 hover:scale-105 transition-all group">
                        <Play className="w-5 h-5 group-hover:scale-110 transition-transform" /> Ver Demo
                      </Button>
                    </a>
                  </div>
                  <div className="heroSt flex gap-10">
                    {stats.slice(0,3).map((s,i) => (
                      <div key={i} className="cursor-default hover:-translate-y-1 transition-transform">
                        <div className="text-2xl font-black tabular-nums"><AnimatedCounter value={s.value} /></div>
                        <div className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative hidden lg:block heroI">
                  <div className="af relative">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/15 ag">
                      <img src={heroBusiness} alt="Faktura em accao" className="w-full h-auto object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                    </div>
                    <div className="af3 absolute -bottom-6 -left-8 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="relative pulse-ring w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div><p className="text-sm font-bold">Conformidade AGT</p><p className="text-xs text-muted-foreground">100% certificado</p></div>
                      </div>
                    </div>
                    <div className="af2 absolute -top-4 -right-6 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-xs font-bold">FT 2025/1283</p><p className="text-xs text-primary font-semibold">✓ Enviada</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative">
              <FadeIn direction="up" delay={200}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 group">
                  <img src={dashboardPreview} alt="Dashboard Faktura" className="w-full h-auto group-hover:scale-[1.01] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── STATS ── */}
          <section className="py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {stats.map((s,i) => {
                  const I = s.icon;
                  return (
                    <FadeIn key={i} delay={i*100} direction="up">
                      <div className="bg-card border border-border/50 rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all cursor-default group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                          <I className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-3xl font-black tabular-nums mb-1"><AnimatedCounter value={s.value} /></div>
                        <div className="text-xs text-muted-foreground font-semibold">{s.label}</div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ████████████████████████████████████████████
               LEMA SECTION — COM A FAKTURA TODOS FACTURAM
             ████████████████████████████████████████████ */}
          <section className="lema-section py-24 lg:py-36">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'radial-gradient(circle, rgba(255,255,255,1) 1.5px, transparent 1.5px)', backgroundSize:'48px 48px' }} />
              <div className="absolute bottom-0 left-0 right-0 ticker-wrap py-4 border-t border-white/10">
                <div className="ticker-inner">
                  {[...Array(8)].map((_,i) => (
                    <span key={i} className="text-white/15 font-black text-5xl uppercase tracking-widest mx-12 select-none">
                      Com a Faktura, todos facturam.
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
              <FadeIn direction="up">
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-8 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-sm font-bold text-white">O lema que nos define</span>
                </div>
              </FadeIn>

              <div className="lema-text text-white mb-8">
                Com a Faktura,<br />
                <span className="shimmer-text-white">todos facturam.</span>
              </div>

              <div className="lema-sub">
                <p className="text-white/70 text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-12">
                  Empresas emitem faturas mais depressa. Compradores ganham por cada compra. Um ecossistema onde toda a gente beneficia — da mercearia do bairro ao supermercado.
                </p>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                  {[
                    { icon: Building2, t: 'Para Empresas', d: 'Emita faturas em segundos com dados pre-preenchidos. Zero erros, maxima conformidade AGT.', color: 'bg-white/15' },
                    { icon: UserPlus, t: 'Para Compradores', d: 'Registe-se gratuitamente, partilhe o seu ID e ganhe 50 Kz automaticamente por cada fatura.', color: 'bg-white/20' },
                    { icon: Globe, t: 'Para Angola', d: 'Cada fatura emitida fortalece a economia formal e contribui para um pais mais transparente.', color: 'bg-white/15' },
                  ].map(({icon:I,t,d,color},i) => (
                    <div key={i} className={`${color} backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left hover:bg-white/25 transition-all hover:-translate-y-1 group`}>
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                        <I className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-2">{t}</h3>
                      <p className="text-white/65 text-sm leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/registar">
                    <Button size="lg" className="h-13 px-10 font-black bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl gap-2 text-base">
                      Comecar Gratis <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <a href="#ecosystem">
                    <Button size="lg" variant="outline" className="h-13 px-8 font-bold border-2 border-white/50 text-white hover:bg-white/10 hover:border-white transition-all gap-2 text-base">
                      Ver o Ecossistema <ChevronRight className="w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </section>
          {/* ████████████████████████████████████████████ */}

          {/* ── ECOSSISTEMA ── */}
          <section id="ecosystem" className="py-28 relative overflow-hidden bg-muted/20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/4 rounded-full blur-[120px]" />
              <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage:'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize:'48px 48px' }} />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn direction="up">
                <div className="text-center mb-20">
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-bold">Com a Faktura, todos facturam.</span>
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-5">Um ecossistema que<span className="shimmer-text"> recompensa</span><br />quem compra e quem vende</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">Disponibilize os seus dados de comprador, ganhe por cada fatura e ajude empresas a faturar mais rapido — sem erros, sem complicacoes.</p>
                </div>
              </FadeIn>

              <div className="grid lg:grid-cols-2 gap-8 mb-20">
                {/* Compradores */}
                <FadeIn direction="left" delay={100}>
                  <div className="ec bg-card border-2 border-border/50 rounded-3xl p-8 lg:p-10 h-full hover:border-primary/30 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/40 transition-all duration-500" />
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><UserPlus className="w-7 h-7 text-primary" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-0.5">Para Compradores</p>
                        <h3 className="text-2xl font-black">O seu consumo gera recompensa</h3>
                      </div>
                    </div>
                    <div className="bg-muted/60 border border-border/60 rounded-2xl p-5 mb-7">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">O seu ID de comprador</p>
                      <div className="flex items-center justify-between">
                        <div><p className="id-badge text-2xl font-black tracking-widest">M20XV</p><p className="text-xs text-muted-foreground mt-1">500****21 · 923***574 · Manuel Silva</p></div>
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><ScanLine className="w-5 h-5 text-primary" /></div>
                      </div>
                    </div>
                    <div className="bg-primary/8 border border-primary/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0"><BadgeDollarSign className="w-6 h-6 text-primary" /></div>
                      <div>
                        <p className="text-xl font-black">50 Kz por fatura</p>
                        <p className="text-sm text-muted-foreground">automaticamente em cada fatura acima de <strong className="text-foreground">1.500 Kz</strong></p>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-7">
                      {['Cadastro gratuito e imediato','ID unico gerado automaticamente','Privacidade garantida — dados parcialmente mascarados','Historico de faturas sempre disponivel','Transparencia total sobre o uso dos seus dados'].map((x,i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{x}
                        </li>
                      ))}
                    </ul>
                    <Link to="/registar">
                      <Button className="w-full h-12 font-bold btn-glow hover:scale-[1.02] transition-all gap-2">Criar o meu ID de comprador <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </FadeIn>

                {/* Empresas */}
                <FadeIn direction="right" delay={200}>
                  <div className="ec bg-card border-2 border-border/50 rounded-3xl p-8 lg:p-10 h-full hover:border-primary/30 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/40 transition-all duration-500" />
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-primary" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-0.5">Para Empresas</p>
                        <h3 className="text-2xl font-black">Fature em segundos, sem erros</h3>
                      </div>
                    </div>
                    <div className="bg-muted/60 border border-border/60 rounded-2xl p-5 mb-7 space-y-3">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Como funciona na pratica</p>
                      {[['1','Cliente informa o seu ID','Ex: M20XV'],['2','Insere o ID na Faktura','Pesquisa instantanea'],['3','Dados preenchidos automaticamente','Nome, NIF, contacto'],['4','Fatura emitida e enviada','WhatsApp, SMS ou email']].map(([s,t,b]) => (
                        <div key={s} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0"><span className="text-xs font-black text-primary">{s}</span></div>
                          <div className="flex-1 min-w-0"><span className="text-sm font-semibold">{t}</span><span className="text-xs text-muted-foreground ml-2">{b}</span></div>
                          {s!=='4' ? <ChevronRight className="w-3 h-3 text-muted-foreground/40" /> : <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-3 mb-7">
                      {['Base activa de compradores pre-cadastrados','Preenchimento automatico — zero digitacao manual','Reducao drastica de erros fiscais','Dados padronizados e validados','Historico completo de faturacao por cliente'].map((x,i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{x}
                        </li>
                      ))}
                    </ul>
                    <Link to="/registar">
                      <Button variant="outline" className="w-full h-12 font-bold border-2 hover:bg-primary/5 hover:border-primary/50 transition-all gap-2">Experimentar para a minha empresa <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </FadeIn>
              </div>

              {/* Steps */}
              <FadeIn direction="up">
                <div className="text-center mb-10"><h3 className="text-3xl font-black mb-2">Como funciona</h3><p className="text-muted-foreground">Simples. Seguro. Automatico.</p></div>
              </FadeIn>
              <div className="grid md:grid-cols-4 gap-6 mb-16">
                {[[UserPlus,'01','Crie a sua conta','Registe-se gratuitamente e receba o seu ID unico de comprador.'],[ScanLine,'02','Partilhe o seu ID','Ao fazer compras, informe o seu ID ao vendedor. Ex: M20XV.'],[FileText,'03','A fatura e emitida','A empresa usa o seu ID para preencher os dados automaticamente.'],[Wallet,'04','Receba os seus 50 Kz','Por cada fatura acima de 1.500 Kz, 50 Kz sao creditados automaticamente.']].map(([I,s,t,d],i) => (
                  <FadeIn key={i} delay={i*100} direction="up">
                    <div className="ec group bg-card border border-border/50 rounded-2xl p-6 text-center hover:border-primary/30 h-full relative">
                      {i<3 && <div className="hidden md:block absolute top-8 left-[calc(100%-1px)] w-6 h-px bg-gradient-to-r from-primary/30 to-primary/10 z-10" />}
                      <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                        <I className="w-7 h-7 text-primary" />
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">{i+1}</span>
                      </div>
                      <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">{s}</p>
                      <h4 className="font-bold text-base mb-2">{t}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Earnings */}
              <FadeIn direction="up" delay={150}>
                <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
                        <Repeat className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Exemplo de ganhos</span>
                      </div>
                      <h3 className="text-3xl font-black mb-4">Quanto pode ganhar<br />por mes?</h3>
                      <p className="text-muted-foreground leading-relaxed">Cada vez que fizer uma compra acima de 1.500 Kz numa empresa que usa a Faktura, recebe automaticamente <strong className="text-foreground">50 Kz</strong>. Quanto mais comprar, mais ganha.</p>
                    </div>
                    <div className="space-y-4">
                      {[[10,500,'Compras ocasionais'],[30,1500,'Compras regulares'],[60,3000,'Comprador activo']].map(([f,t,l],i) => (
                        <div key={i} className="bg-muted/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold">{l}</span>
                            <span className="text-sm font-black text-primary">{t} Kz/mes</span>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width:`${(f/60)*100}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{f} faturas x 50 Kz</p>
                        </div>
                      ))}
                      <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                        <BadgeDollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">Os ganhos sao acumulados automaticamente na sua carteira Faktura.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage:'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                <FadeIn direction="left">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-5">
                      <Zap className="w-4 h-4 text-primary" /><span className="text-sm font-bold">Funcionalidades</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-5">Tudo que precisa para<span className="shimmer-text"> faturar</span></h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">Ferramentas poderosas desenhadas especificamente para o mercado angolano. Clique nos cards para saber mais.</p>
                  </div>
                </FadeIn>
                <FadeIn direction="right" delay={150}>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30 group">
                    <img src={teamCollab} alt="Equipa a colaborar" className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                </FadeIn>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => {
                  const I = f.icon;
                  const open = expandedFeature === i;
                  return (
                    <FadeIn key={i} delay={i*80} direction="up">
                      <div
                        className={`fc group bg-card rounded-2xl p-8 border cursor-pointer h-full flex flex-col ${open ? 'border-primary/50 shadow-xl shadow-primary/10' : 'border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/8'}`}
                        onClick={() => setExpandedFeature(open ? null : i)}
                      >
                        <div className={`fi w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 ${open ? 'bg-primary/20' : 'group-hover:bg-primary/20'}`}>
                          <I className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm flex-1">{f.description}</p>
                        {open && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-sm text-muted-foreground leading-relaxed">{f.detail}</p>
                          </div>
                        )}
                        <div className={`mt-4 flex items-center gap-1 text-primary text-sm font-semibold transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                          {open ? 'Fechar' : 'Saber mais'} <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── CTA MID ── */}
          <section className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn direction="up">
                <div className="relative bg-accent rounded-3xl p-12 lg:p-20 overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl af2" />
                  <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl af" />
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'linear-gradient(hsl(var(--primary)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--primary)) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-5 py-2 mb-6">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      <span className="text-sm font-bold">Sem cartao de credito</span>
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-accent-foreground mb-6 tracking-tight">Pronto para <span className="shimmer-text">comecar?</span></h2>
                    <p className="text-lg text-accent-foreground/60 max-w-xl mx-auto mb-10">Junte-se a centenas de empresas angolanas. Configure em 2 minutos.</p>
                    <Link to="/registar">
                      <Button size="lg" className="h-14 px-10 text-lg font-black shadow-2xl shadow-primary/40 btn-glow hover:scale-110 transition-all group gap-2">
                        Criar Conta Gratis <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── CLIENTS ── */}
          <section id="clients" className="py-24 bg-muted/30 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn direction="up">
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Empresas que ja utilizam a <span className="shimmer-text">Faktura</span></h2>
                  <p className="text-lg text-muted-foreground">Junte-se as empresas que confiam na nossa plataforma.</p>
                </div>
              </FadeIn>
            </div>
            <div className="relative w-full">
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/80 to-transparent z-10 pointer-events-none" />
              <div className="flex asx w-max gap-6 hover:[animation-play-state:paused]">
                {[...clientLogos,...clientLogos,...clientLogos,...clientLogos].map((c,i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex items-center justify-center h-24 w-52 flex-shrink-0 hover:border-primary/30 hover:shadow-lg transition-all group">
                    <img src={c.logo} alt={c.name} className="max-h-14 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section id="pricing" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn direction="up">
                <div className="text-center mb-16">
                  <h2 className="text-4xl lg:text-5xl font-black mb-4">Precos <span className="shimmer-text">simples</span></h2>
                  <p className="text-lg text-muted-foreground mb-6">Sem surpresas. Comece gratis e cresca connosco.</p>
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-bold">Poupe 10% no plano trimestral!</span>
                  </div>
                </div>
              </FadeIn>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  { name:'Basico', price:'7.500', trim:'20.250', features:['Ate 100 faturas/mes','Faturas, Recibos e Proformas','Gestao de clientes','Dashboard basico','Envio por email','Suporte por email'], popular:false },
                  { name:'Completo', price:'10.000', trim:'27.000', features:['Faturas ilimitadas','Todos os tipos de documentos','Multi-canal (WhatsApp, SMS, Email)','Relatorios avancados','Conformidade AGT total','Suporte prioritario'], popular:true },
                  { name:'Empresa', price:null, trim:null, features:['Tudo do Completo','Multi-empresa','API dedicada','Gestor de conta dedicado','SLA personalizado'], popular:false },
                ].map((p,i) => (
                  <FadeIn key={i} delay={i*120} direction="up">
                    <div className={`pc rounded-2xl p-8 border-2 h-full flex flex-col ${p.popular ? 'border-primary shadow-2xl shadow-primary/15 ag relative' : 'border-border/50 bg-card hover:border-primary/20 hover:shadow-xl'}`}>
                      {p.popular && (
                        <>
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black px-5 py-1.5 rounded-full shadow-lg">MAIS POPULAR</div>
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                        </>
                      )}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3">{p.name}</h3>
                        {p.price ? (
                          <>
                            <div className="mb-1 flex items-end gap-1"><span className="text-4xl font-black">{p.price}</span><span className="text-muted-foreground mb-1">Kz/mes</span></div>
                            <p className="text-sm text-muted-foreground">ou <span className="font-bold">{p.trim} Kz</span>/trim. <span className="text-primary font-bold">(−10%)</span></p>
                          </>
                        ) : (
                          <><div className="mb-1"><span className="text-3xl font-black">Sob medida</span></div><p className="text-sm text-muted-foreground">Contacte-nos para um plano personalizado</p></>
                        )}
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {p.features.map((x,j) => (
                          <li key={j} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />{x}
                          </li>
                        ))}
                      </ul>
                      <Link to="/registar" className="block">
                        {p.popular
                          ? <Button className="w-full h-12 font-bold shadow-lg shadow-primary/25 btn-glow hover:scale-105 transition-all">Escolher Completo</Button>
                          : p.price
                          ? <Button variant="outline" className="w-full h-12 font-bold border-2 hover:bg-primary/5 hover:border-primary/50 transition-all">Comecar Agora</Button>
                          : <Button variant="outline" className="w-full h-12 font-bold border-2 hover:bg-primary/5 hover:border-primary/50 transition-all">Contactar Vendas</Button>
                        }
                      </Link>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section id="faq" className="py-24 bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn direction="up">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
                    <HelpCircle className="w-4 h-4 text-primary" /><span className="text-sm font-bold">FAQ</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black mb-4">Perguntas <span className="shimmer-text">Frequentes</span></h2>
                  <p className="text-lg text-muted-foreground">Tudo que precisa saber sobre faturacao em Angola.</p>
                </div>
              </FadeIn>
              <FadeIn direction="up" delay={150}>
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((f,i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-2xl border border-border/50 px-6 hover:border-primary/20 transition-colors overflow-hidden">
                      <AccordionTrigger className="text-left font-bold hover:no-underline py-5 hover:text-primary transition-colors">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FadeIn>
            </div>
          </section>
        </>
      )}

      {/* ── FOOTER ── (always visible) */}
      <footer className="bg-accent text-accent-foreground py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Lema footer */}
          <div className="text-center mb-12 py-6 border-b border-accent-foreground/10">
            <p className="text-2xl lg:text-3xl font-black text-accent-foreground/80 tracking-tight">
              Com a Faktura, <span className="text-primary">todos facturam.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <button onClick={() => setActivePage(null)}>
                <img src={logoFaktura} alt="Faktura" className="h-10 object-contain brightness-0 invert mb-4" />
              </button>
              <p className="text-sm text-accent-foreground/50 leading-relaxed">A plataforma de faturacao mais moderna de Angola.</p>
              <div className="flex gap-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-accent-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"><Phone className="w-3.5 h-3.5 text-accent-foreground/50" /></div>
                <div className="w-8 h-8 rounded-full bg-accent-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"><Mail className="w-3.5 h-3.5 text-accent-foreground/50" /></div>
                <div className="w-8 h-8 rounded-full bg-accent-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"><Globe className="w-3.5 h-3.5 text-accent-foreground/50" /></div>
              </div>
            </div>
            {Object.entries(footerLinks).map(([cat, links]) => (
              <div key={cat}>
                <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-accent-foreground/50">{cat}</h4>
                <ul className="space-y-2.5 text-sm">
                  {links.map(([_, label, page]) => (
                    <li key={label}>
                      {page ? (
                        <button onClick={() => setActivePage(page)} className="text-accent-foreground/40 hover:text-primary transition-colors duration-200 flex items-center gap-1 group">
                          {label} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </button>
                      ) : (
                        <a href={"#"+label.toLowerCase().replace(/\s/g,'')} onClick={() => setActivePage(null)} className="text-accent-foreground/40 hover:text-primary transition-colors duration-200">{label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-accent-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-accent-foreground/30">© {new Date().getFullYear()} Faktura Angola. Todos os direitos reservados.</p>
            <p className="text-sm text-accent-foreground/20 italic">Com a Faktura, todos facturam.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}