import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Users,
  Globe,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Clock,
  Play,
  HelpCircle,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import logoFaktura from '@/assets/logo-faktura.png';
import heroBusiness from '@/assets/hero-business.jpg';
import dashboardPreview from '@/assets/dashboard-preview.png';
import logoOrbislink from '@/assets/logos/orbislink.png';
import logoCalmind from '@/assets/logos/calmind.png';
import logoPlaka from '@/assets/logos/plaka.jpg';
import logoAgrilink from '@/assets/logos/agrilink.png';
import logoAlphadata from '@/assets/logos/alphadata.png';
import teamCollab from '@/assets/team-collab.jpg';

const features = [
  {
    icon: FileText,
    title: 'Faturas Instantâneas',
    description: 'Crie e envie faturas profissionais em segundos com modelos personalizáveis.',
  },
  {
    icon: Shield,
    title: 'Conformidade AGT',
    description: 'Certificação digital, QR codes e assinaturas em total conformidade fiscal.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Inteligentes',
    description: 'Dashboard completo com métricas em tempo real do seu negócio.',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Base de dados completa com histórico de transações e contactos.',
  },
  {
    icon: Globe,
    title: 'Multi-Canal',
    description: 'Envie faturas por WhatsApp, SMS ou email automaticamente.',
  },
  {
    icon: Clock,
    title: 'Automatização',
    description: 'Faturas recorrentes, lembretes de pagamento e relatórios automáticos.',
  },
];

const stats = [
  { value: '500+', label: 'Empresas Activas' },
  { value: '50K+', label: 'Faturas Emitidas' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Suporte' },
];

const clientLogos = [
  { name: 'Orbis.Link', logo: logoOrbislink },
  { name: 'CalMind', logo: logoCalmind },
  { name: 'Plaka', logo: logoPlaka },
  { name: 'AgriLink', logo: logoAgrilink },
  { name: 'AlphaData', logo: logoAlphadata },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logoFaktura} alt="Faktura" className="h-9 object-contain" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Preços</a>
              <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              <a href="#clients" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Clientes</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold">Entrar</Button>
              </Link>
              <Link to="/registar">
                <Button className="font-bold shadow-lg shadow-primary/25">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Image */}
      <section className="relative pt-24 pb-0 lg:pt-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">A plataforma #1 de Angola</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[0.95]">
                Faturação que
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">impulsiona</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 lg:h-5 bg-primary/20 -skew-x-3 rounded-sm" />
                </span>
                <br />
                o seu negócio
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Emita faturas profissionais, gerencie clientes e mantenha-se em conformidade com a AGT — tudo num só lugar.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                <Link to="/registar">
                  <Button size="lg" className="h-14 px-8 text-lg font-black shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all group">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2 gap-2">
                    <Play className="w-5 h-5" />
                    Ver Demo
                  </Button>
                </a>
              </div>

              {/* Stats inline */}
              <div className="flex gap-8">
                {stats.slice(0, 3).map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-black text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/10">
                <img src={heroBusiness} alt="Faktura em ação" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Conformidade AGT</p>
                    <p className="text-xs text-muted-foreground">100% certificado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
            <img src={dashboardPreview} alt="Dashboard Faktura" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Funcionalidades</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                Tudo que precisa para
                <span className="text-primary"> faturar</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Ferramentas poderosas desenhadas especificamente para o mercado angolano.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={teamCollab} alt="Equipa a colaborar" className="w-full h-72 object-cover" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-accent rounded-3xl p-12 lg:p-20 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 text-center">
              <h2 className="text-4xl lg:text-6xl font-black text-accent-foreground mb-6 tracking-tight">
                Pronto para <span className="text-primary">começar?</span>
              </h2>
              <p className="text-lg text-accent-foreground/60 max-w-xl mx-auto mb-8">
                Junte-se a centenas de empresas angolanas. Configure em 2 minutos, sem cartão de crédito.
              </p>
              <Link to="/registar">
                <Button size="lg" className="h-14 px-10 text-lg font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all group">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clients / Companies */}
      <section id="clients" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Empresas que já utilizam a <span className="text-primary">Faktura</span>
            </h2>
            <p className="text-lg text-muted-foreground">Junte-se às empresas que confiam na nossa plataforma.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
            {clientLogos.map((client, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex items-center justify-center h-28 w-52"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="max-h-16 max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Preços <span className="text-primary">simples</span>
            </h2>
            <p className="text-lg text-muted-foreground">Sem surpresas. Comece grátis e cresça connosco.</p>
          </div>

          {/* Billing toggle info */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Poupe 10% no plano trimestral!</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Básico */}
            <div className="bg-card rounded-2xl p-8 border-2 border-border/50">
              <h3 className="text-xl font-bold mb-2">Básico</h3>
              <div className="mb-2">
                <span className="text-4xl font-black">7.500</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">ou <span className="font-bold">20.250 Kz/trimestre</span> <span className="text-primary font-bold">(poupe 10%)</span></p>
              <ul className="space-y-3 mb-8">
                {['Até 100 faturas/mês', 'Faturas, Recibos e Proformas', 'Gestão de clientes', 'Dashboard básico', 'Envio por email', 'Suporte por email'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registar">
                <Button variant="outline" className="w-full h-12 font-bold border-2">Começar Agora</Button>
              </Link>
            </div>

            {/* Completo */}
            <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-xl shadow-primary/10 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                MAIS POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Completo</h3>
              <div className="mb-2">
                <span className="text-4xl font-black">10.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">ou <span className="font-bold">27.000 Kz/trimestre</span> <span className="text-primary font-bold">(poupe 10%)</span></p>
              <ul className="space-y-3 mb-8">
                {['Faturas ilimitadas', 'Todos os tipos de documentos', 'Multi-canal (WhatsApp, SMS, Email)', 'Relatórios avançados', 'Conformidade AGT total', 'Suporte prioritário', 'Voz incluída'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registar">
                <Button className="w-full h-12 font-bold shadow-lg shadow-primary/25">Escolher Completo</Button>
              </Link>
            </div>

            {/* Empresa */}
            <div className="bg-card rounded-2xl p-8 border-2 border-border/50">
              <h3 className="text-xl font-bold mb-2">Empresa</h3>
              <div className="mb-2">
                <span className="text-4xl font-black">Sob medida</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Contacte-nos para um plano personalizado</p>
              <ul className="space-y-3 mb-8">
                {['Tudo do Completo', 'Multi-empresa', 'API dedicada', 'Gestor de conta dedicado', 'SLA personalizado'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-12 font-bold border-2">Contactar Vendas</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">FAQ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
            <p className="text-lg text-muted-foreground">Tudo que precisa saber sobre faturação em Angola.</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Quais tipos de documentos posso emitir na Faktura?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 space-y-2">
                <p>Pode emitir os seguintes documentos:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Fatura (FT)</strong> – Documento fiscal oficial reconhecido pelo fisco.</li>
                  <li><strong>Recibo (RC)</strong> – Comprovante de pagamento, útil para transações internas e pagamentos parciais.</li>
                  <li><strong>Proforma (PRO)</strong> – Documento não fiscal que antecipa os valores e condições de venda antes da emissão da fatura oficial.</li>
                  <li><strong>Fatura-Recibo (FR)</strong> – Documento híbrido que funciona como fatura fiscal e comprovante de pagamento ao mesmo tempo.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                O que é faturação electrónica em Angola?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                A faturação electrónica é o processo de emissão, envio e armazenamento de faturas em formato digital, conforme as normas da AGT (Administração Geral Tributária). Permite maior eficiência, segurança e conformidade fiscal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Preciso de um software específico para emitir faturas legais?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim. A Faktura permite emitir faturas, recibos, proformas e faturas-recibo válidos para o fisco, sem precisar imprimir ou preencher manualmente. Todos os documentos incluem assinatura digital, QR code e numeração sequencial conforme exigido pela AGT.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Posso enviar documentos directamente para o cliente pelo WhatsApp?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim! A Faktura envia automaticamente faturas, recibos, proformas e faturas-recibo via WhatsApp, SMS ou email. Basta configurar o canal preferido nas definições.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Quais planos estão disponíveis e qual o preço?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 space-y-2">
                <p>Oferecemos dois planos principais com opção mensal ou trimestral:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Básico:</strong> 7.500 Kz/mês ou 20.250 Kz/trimestre (poupe 10%)</li>
                  <li><strong>Completo (voz incluída):</strong> 10.000 Kz/mês ou 27.000 Kz/trimestre (poupe 10%)</li>
                  <li><strong>Empresa:</strong> Preço sob medida para grandes organizações</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                É obrigatório armazenar faturas electrónicas?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim. Todos os documentos emitidos (faturas, recibos, proformas e faturas-recibo) devem ser armazenados digitalmente por pelo menos 5 anos, conforme a legislação fiscal angolana.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Posso usar a Faktura em qualquer tipo de negócio?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim. A nossa plataforma é adaptável para micro, pequenas e médias empresas de qualquer sector de actividade em Angola.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-card rounded-2xl border border-border/50 px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                Existe suporte técnico caso eu tenha problemas?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim! A nossa equipa está disponível para resolver qualquer dúvida ou problema técnico relacionado à emissão e envio de documentos. O plano Completo inclui suporte prioritário.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent text-accent-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src={logoFaktura} alt="Faktura" className="h-10 object-contain brightness-0 invert mb-4" />
              <p className="text-sm text-accent-foreground/50 leading-relaxed">
                A plataforma de faturação mais moderna de Angola.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-accent-foreground/60">Produto</h4>
              <ul className="space-y-2 text-sm text-accent-foreground/50">
                <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-accent-foreground/60">Empresa</h4>
              <ul className="space-y-2 text-sm text-accent-foreground/50">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-accent-foreground/60">Legal</h4>
              <ul className="space-y-2 text-sm text-accent-foreground/50">
                <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-accent-foreground/10 pt-8 text-center">
            <p className="text-sm text-accent-foreground/40">
              © {new Date().getFullYear()} Faktura Angola. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
