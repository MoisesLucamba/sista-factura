import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, Package,
  BarChart3, Settings, Building2, Truck,
  Receipt, Search, LogOut, ChevronLeft,
  ChevronRight, Bell, X, ShieldCheck,
  Wallet, CreditCard, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoFaktura from '@/assets/logo-faktura.png';

/* ── Nav config ───────────────────────────────────── */
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'alert';
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'    },
  { icon: FileText,        label: 'Faturas',      href: '/faturas',     badge: 'novo' },
  { icon: Wallet,          label: 'Carteira',     href: '/carteira'     },
  { icon: CreditCard,      label: 'Pagamentos',   href: '/pagamentos'   },
  { icon: Users,           label: 'Clientes',     href: '/clientes'     },
  { icon: Truck,           label: 'Fornecedores', href: '/fornecedores' },
  { icon: Package,         label: 'Produtos',     href: '/produtos'     },
  { icon: Receipt,         label: 'Documentos',   href: '/documentos'   },
  { icon: BarChart3,       label: 'Relatórios',   href: '/relatorios'   },
];

const secondaryNavItems: NavItem[] = [
  { icon: ShieldCheck, label: 'Admin', href: '/admin' },
  { icon: Building2, label: 'Empresa',        href: '/empresa'       },
  { icon: Settings,  label: 'Configurações',  href: '/configuracoes' },
];

/* ═══════════════════════════════════════════════════ */
export function Sidebar() {
  const [collapsed, setCollapsed]     = useState(false);
  const [search, setSearch]           = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const location = useLocation();
  const { role, profile } = useAuth();

  /* Close search on nav */
  useEffect(() => { setSearch(''); setSearchOpen(false); }, [location.pathname]);

  /* Filter nav by search */
  const filteredMain = mainNavItems.filter(i =>
    !search || i.label.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSecondary = secondaryNavItems.filter(i => {
    if (i.href === '/admin' && role !== 'admin') return false;
    return !search || i.label.toLowerCase().includes(search.toLowerCase());
  });

  /* ── NavLink ─────────────────────────────────────── */
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;
    const key = item.href.replace('/', '');

    const content = (
      <Link
        to={item.href}
        data-active={isActive ? key : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
          collapsed ? 'h-10 w-10 justify-center mx-auto' : 'px-3 py-2.5 w-full',
          isActive
            ? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold border border-sidebar-primary/20'
            : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
        )}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-sidebar-primary" />
        )}

        {isActive && collapsed && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sidebar-primary shadow-[0_0_6px_2px_hsl(var(--sidebar-primary)/.4)]" />
        )}

        <div className={cn(
          'nav-icon relative flex-shrink-0 flex items-center justify-center transition-colors duration-200',
          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground',
        )}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
        </div>

        {!collapsed && (
          <span className="text-sm whitespace-nowrap leading-none">{item.label}</span>
        )}

        {!collapsed && item.badge && (
          <span className={cn(
            'ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide leading-none',
            isActive ? 'bg-sidebar-primary/20 text-sidebar-primary' : 'bg-sidebar-accent text-sidebar-foreground/60'
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl px-3 py-1.5 text-xs font-semibold">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col',
        'transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* ── Top glow line ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sidebar-primary/30 to-transparent pointer-events-none" />

      {/* ── Header ─────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-16 px-3 flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/20 flex items-center justify-center">
            <img src={logoFaktura} alt="Faktura" className="w-[22px] h-[22px] object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-black text-[15px] tracking-tight text-sidebar-foreground leading-none">Faktura</span>
              <span className="text-[9px] text-sidebar-primary font-bold uppercase tracking-[.18em] mt-0.5">Fintech</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link to="/notificacoes" className="relative w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all flex-shrink-0">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_6px_2px_hsl(var(--destructive)/.4)]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Notificações</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Search ─────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 mb-4 flex-shrink-0">
          <div className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            searchOpen
              ? 'bg-sidebar-accent border-sidebar-primary/30'
              : 'bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-border'
          )}>
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-sidebar-foreground/40 pointer-events-none flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => !search && setSearchOpen(false)}
              placeholder="Pesquisar…"
              className="w-full bg-transparent py-2 pl-8 pr-8 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/35 outline-none"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchOpen(false); }}
                className="absolute right-2 w-4 h-4 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary/20 transition-colors"
              >
                <X className="w-2.5 h-2.5 text-sidebar-foreground/60" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Nav ────────────────────────────────────── */}
      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar space-y-5">
        <div>
          {!collapsed && !search && (
            <p className="px-3 mb-2 text-[9px] font-black text-sidebar-foreground/30 uppercase tracking-[.16em]">
              Principal
            </p>
          )}
          <div className="space-y-0.5">
            {filteredMain.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            {filteredMain.length === 0 && (
              <p className="px-3 py-2 text-xs text-sidebar-foreground/30 text-center">Sem resultados</p>
            )}
          </div>
        </div>

        <div className="mx-3 h-px bg-sidebar-border rounded-full" />

        <div>
          {!collapsed && !search && (
            <p className="px-3 mb-2 text-[9px] font-black text-sidebar-foreground/30 uppercase tracking-[.16em]">
              Sistema
            </p>
          )}
          <div className="space-y-0.5">
            {filteredSecondary.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* ── Footer ─────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-3 border-t border-sidebar-border space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border hover:bg-sidebar-accent transition-all group cursor-pointer">
            <div className="relative flex-shrink-0">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-[11px] font-black">
                  {profile?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-sidebar" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-bold text-sidebar-foreground leading-none truncate">
                {profile?.nome || 'Utilizador'}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 mt-0.5 truncate capitalize">
                {role || 'Utilizador'}
              </span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <div className="relative cursor-pointer">
                  <Avatar className="h-9 w-9 border border-sidebar-border hover:ring-2 hover:ring-sidebar-primary/20 transition-all">
                    <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-xs font-black">
                      {profile?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{profile?.nome || 'Utilizador'}</TooltipContent>
          </Tooltip>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all text-xs',
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
