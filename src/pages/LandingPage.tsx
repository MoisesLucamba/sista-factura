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
  Star,
  ChevronRight,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import logoFaktura from '@/assets/logo-faktura.png';

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

const testimonials = [
  {
    name: 'Maria Santos',
    role: 'CEO, ComércioPlus Lda',
    text: 'O Faktura revolucionou a nossa facturação. Antes levávamos horas, agora são minutos.',
    rating: 5,
  },
  {
    name: 'Pedro Neto',
    role: 'Contabilista, FinAngola',
    text: 'A conformidade com a AGT é perfeita. Nunca mais tivemos problemas fiscais.',
    rating: 5,
  },
  {
    name: 'Ana Ferreira',
    role: 'Directora, TechLuanda',
    text: 'Interface incrível e fácil de usar. Recomendo a todas as empresas angolanas.',
    rating: 5,
  },
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
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testemunhos</a>
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Nova versão 2.0 disponível</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
            Faturação que
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">impulsiona</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 lg:h-6 bg-primary/20 -skew-x-3 rounded-sm" />
            </span>
            <br />
            o seu negócio
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A plataforma de faturação mais moderna e poderosa de Angola. 
            Emita faturas, gerencie clientes e mantenha-se em conformidade com a AGT — tudo num só lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/registar">
              <Button size="lg" className="h-14 px-8 text-lg font-black shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all group">
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2">
                Ver Funcionalidades
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-3xl lg:text-4xl font-black text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Funcionalidades</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Tudo que precisa para
              <span className="text-primary"> faturar</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas desenhadas especificamente para o mercado angolano.
            </p>
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

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              O que dizem os nossos <span className="text-primary">clientes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card rounded-2xl p-8 border border-border/50 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
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

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-card rounded-2xl p-8 border-2 border-border/50">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-black">Grátis</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Até 50 faturas/mês', 'Gestão de clientes', 'Dashboard básico', 'Suporte por email'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registar">
                <Button variant="outline" className="w-full h-12 font-bold border-2">Começar Grátis</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-xl shadow-primary/10 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                MAIS POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Profissional</h3>
              <div className="mb-6">
                <span className="text-4xl font-black">25.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Faturas ilimitadas', 'Multi-canal (WhatsApp, SMS, Email)', 'Relatórios avançados', 'Conformidade AGT total', 'Suporte prioritário'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registar">
                <Button className="w-full h-12 font-bold shadow-lg shadow-primary/25">Escolher Pro</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-card rounded-2xl p-8 border-2 border-border/50">
              <h3 className="text-xl font-bold mb-2">Empresa</h3>
              <div className="mb-6">
                <span className="text-4xl font-black">Sob medida</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Tudo do Profissional', 'Multi-empresa', 'API dedicada', 'Gestor de conta dedicado', 'SLA personalizado'].map((item, i) => (
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
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
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
