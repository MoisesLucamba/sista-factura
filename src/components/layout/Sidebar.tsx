import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, Package,
  BarChart3, Settings, Building2, Truck,
  Receipt, Search, LogOut, ChevronLeft,
  ChevronRight, Bell, X, ShieldCheck, Store, MapPin, ScanLine,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoFaktura from '@/assets/faktura-logo.png';

/* ─── Types ────────────────────────────────────────── */
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

/* ─── Nav config ────────────────────────────────────── */
const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'    },
  { icon: FileText,        label: 'Faturas',      href: '/faturas',     badge: 'novo' },
  { icon: Users,           label: 'Clientes',     href: '/clientes'     },
  { icon: Truck,           label: 'Fornecedores', href: '/fornecedores' },
  { icon: Package,         label: 'Produtos',     href: '/produtos'     },
  { icon: ScanLine,        label: 'POS',          href: '/pos'          },
  { icon: Package,         label: 'Stock',        href: '/gestao-stock' },
  { icon: Receipt,         label: 'Documentos',   href: '/documentos'   },
  { icon: BarChart3,       label: 'Relatórios',   href: '/relatorios'   },
  { icon: Store,           label: 'Lojas',        href: '/lojas'        },
  { icon: MapPin,          label: 'Directório',   href: '/directorio'   },
];

const secondaryNavItems: NavItem[] = [
  { icon: ShieldCheck, label: 'Admin',          href: '/admin'         },
  { icon: Building2,   label: 'Empresa',        href: '/empresa'       },
  { icon: Settings,    label: 'Configurações',  href: '/configuracoes' },
];

/* ═══════════════════════════════════════════════════ */
export function Sidebar() {
  const [collapsed, setCollapsed]   = useState(false);
  const [search, setSearch]         = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [hovered, setHovered]       = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const location  = useLocation();
  const { role, profile } = useAuth();

  useEffect(() => { setSearch(''); setSearchFocused(false); }, [location.pathname]);

  const filteredMain = mainNavItems.filter(i =>
    !search || i.label.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSecondary = secondaryNavItems.filter(i => {
    if (i.href === '/admin' && role !== 'admin') return false;
    return !search || i.label.toLowerCase().includes(search.toLowerCase());
  });

  const initials = profile?.nome?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  /* ── NavLink ─────────────────────────────────────── */
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;

    const inner = (
      <Link
        to={item.href}
        onMouseEnter={() => setHovered(item.href)}
        onMouseLeave={() => setHovered(null)}
        className={cn(
          'relative flex items-center gap-3 rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary/40',
          collapsed
            ? 'h-10 w-10 justify-center mx-auto'
            : 'px-3 py-[9px] w-full',
          isActive
            ? 'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/5 text-sidebar-primary'
            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/[0.04]',
        )}
      >
        {/* Active left pill */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] rounded-r-full bg-sidebar-primary shadow-[0_0_8px_2px_hsl(var(--sidebar-primary)/.5)]" />
        )}

        {/* Active dot (collapsed) */}
        {isActive && collapsed && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sidebar-primary shadow-[0_0_8px_3px_hsl(var(--sidebar-primary)/.5)]" />
        )}

        {/* Icon */}
        <span className={cn(
          'flex-shrink-0 transition-all duration-200',
          isActive
            ? 'text-sidebar-primary drop-shadow-[0_0_6px_hsl(var(--sidebar-primary)/.6)]'
            : hovered === item.href
              ? 'text-sidebar-foreground'
              : 'text-sidebar-foreground/40',
        )}>
          <Icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.5 : 2} />
        </span>

        {/* Label */}
        {!collapsed && (
          <span className={cn(
            'text-[13px] leading-none font-medium transition-all duration-200 whitespace-nowrap',
            isActive ? 'font-semibold text-sidebar-foreground' : '',
          )}>
            {item.label}
          </span>
        )}

        {/* Badge */}
        {!collapsed && item.badge && (
          <span className={cn(
            'ml-auto text-[9px] px-1.5 py-[3px] rounded-full font-black uppercase tracking-widest leading-none',
            isActive
              ? 'bg-sidebar-primary/25 text-sidebar-primary'
              : 'bg-white/[0.07] text-sidebar-foreground/40',
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl px-3 py-1.5 text-xs font-semibold">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return inner;
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <>
      {/* Inject custom styles once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');

        .faktura-sidebar {
          font-family: 'DM Sans', sans-serif;
        }

        /* Thin scrollbar */
        .faktura-sidebar nav::-webkit-scrollbar { width: 3px; }
        .faktura-sidebar nav::-webkit-scrollbar-track { background: transparent; }
        .faktura-sidebar nav::-webkit-scrollbar-thumb {
          background: hsl(var(--sidebar-border));
          border-radius: 99px;
        }

        /* Animated gradient border on logo */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .logo-ring::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 13px;
          background: conic-gradient(
            from 0deg,
            hsl(var(--sidebar-primary)/.8),
            transparent 40%,
            transparent 60%,
            hsl(var(--sidebar-primary)/.3)
          );
          animation: spin-slow 4s linear infinite;
          z-index: -1;
        }

        /* Glow pulse on active items */
        @keyframes glow-pulse {
          0%, 100% { opacity: .5; }
          50%       { opacity: 1;  }
        }

        /* Search focus ring */
        .search-input:focus-within {
          box-shadow: 0 0 0 2px hsl(var(--sidebar-primary)/.25),
                      inset 0 1px 0 hsl(255 255 255 / .03);
        }
      `}</style>

      <aside
        className={cn(
          'faktura-sidebar',
          'fixed left-0 top-0 z-40 h-screen flex flex-col',
          'transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          'bg-sidebar border-r border-white/[0.05]',
          collapsed ? 'w-[68px]' : 'w-[220px]',
        )}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--sidebar, 222 20% 9%)) 0%, hsl(var(--sidebar, 222 20% 9%)) 70%, color-mix(in srgb, hsl(var(--sidebar-primary, 210 100% 60%)) 4%, hsl(var(--sidebar, 222 20% 9%))) 100%)',
        }}
      >

        {/* Subtle noise texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '150px' }} />

        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sidebar-primary/40 to-transparent pointer-events-none" />

        {/* ── Header ──────────────────────────────── */}
        <div className={cn(
          'flex items-center h-[60px] px-3 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            {/* Logo mark */}
            <div className="logo-ring relative flex-shrink-0 w-9 h-9 rounded-[13px] bg-sidebar-primary/10 flex items-center justify-center" style={{ isolation: 'isolate' }}>
              <img src={logoFaktura} alt="Faktura" className="w-5 h-5 object-contain relative z-10" />
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-black text-[15px] tracking-tight text-sidebar-foreground leading-none">Faktura</span>
                <span className="mt-[3px] text-[8.5px] font-bold uppercase tracking-[.2em] text-sidebar-primary/80">Angola</span>
              </div>
            )}
          </div>

          {/* Bell */}
          {!collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to="/notificacoes" className="relative w-8 h-8 rounded-xl flex items-center justify-center text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-white/[0.05] transition-all flex-shrink-0 group">
                  <Bell className="w-[15px] h-[15px] transition-transform group-hover:rotate-12 duration-200" />
                  <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,.5)]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Notificações</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── Search ──────────────────────────────── */}
        {!collapsed && (
          <div className="px-3 mb-3 flex-shrink-0">
            <div className={cn(
              'search-input relative flex items-center rounded-xl border transition-all duration-200',
              searchFocused
                ? 'bg-white/[0.05] border-sidebar-primary/30'
                : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04]',
            )}>
              <Search className={cn(
                'absolute left-2.5 w-3.5 h-3.5 pointer-events-none transition-colors duration-200',
                searchFocused ? 'text-sidebar-primary/70' : 'text-sidebar-foreground/30',
              )} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Pesquisar…"
                className="w-full bg-transparent py-[9px] pl-8 pr-7 text-[12px] text-sidebar-foreground placeholder:text-sidebar-foreground/25 outline-none"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  className="absolute right-2 w-4 h-4 rounded-full bg-white/[0.08] flex items-center justify-center hover:bg-sidebar-primary/20 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-sidebar-foreground/50" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Nav ─────────────────────────────────── */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-4 pb-2">

          {/* Main group */}
          <div>
            {!collapsed && !search && (
              <p className="px-2 mb-1.5 text-[9px] font-black uppercase tracking-[.2em] text-sidebar-foreground/20">
                Principal
              </p>
            )}
            <div className="space-y-px">
              {filteredMain.map(item => <NavLink key={item.href} item={item} />)}
              {filteredMain.length === 0 && (
                <p className="px-3 py-3 text-xs text-center text-sidebar-foreground/25">Sem resultados</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={cn('transition-all duration-300', collapsed ? 'mx-2' : 'mx-1')}>
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>

          {/* Secondary group */}
          <div>
            {!collapsed && !search && (
              <p className="px-2 mb-1.5 text-[9px] font-black uppercase tracking-[.2em] text-sidebar-foreground/20">
                Sistema
              </p>
            )}
            <div className="space-y-px">
              {filteredSecondary.map(item => <NavLink key={item.href} item={item} />)}
            </div>
          </div>
        </nav>

        {/* ── Footer ──────────────────────────────── */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 space-y-1.5">
          {/* Top hairline */}
          <div className="mb-2 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

          {!collapsed ? (
            <div className="group flex items-center gap-2.5 px-2.5 py-2 rounded-2xl border border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200 cursor-pointer">
              <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8 ring-1 ring-white/10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-[11px] font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar shadow-[0_0_6px_2px_rgba(16,185,129,.4)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-sidebar-foreground leading-tight truncate">
                  {profile?.nome || 'Utilizador'}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 capitalize truncate mt-px">
                  {role || 'Utilizador'}
                </p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-sidebar-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-9 w-9 ring-1 ring-white/10 hover:ring-sidebar-primary/40 transition-all">
                      <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar shadow-[0_0_6px_2px_rgba(16,185,129,.4)]" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{profile?.nome || 'Utilizador'}</TooltipContent>
            </Tooltip>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-2xl border border-transparent',
              'text-sidebar-foreground/25 hover:text-sidebar-foreground/70',
              'hover:bg-white/[0.04] hover:border-white/[0.05]',
              'transition-all duration-200 text-[11px] font-medium',
            )}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <><ChevronLeft className="w-3.5 h-3.5" /><span>Recolher</span></>
            }
          </button>
        </div>
      </aside>
    </>
  );
}