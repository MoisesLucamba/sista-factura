import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, Package,
  BarChart3, Settings, Building2, Truck,
  Receipt, Search, LogOut, ChevronLeft,
  ChevronRight, Bell, X, ShieldCheck,
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

  /* Close search on nav */
  useEffect(() => { setSearch(''); setSearchOpen(false); }, [location.pathname]);

  /* Filter nav by search */
  const filteredMain = mainNavItems.filter(i =>
    !search || i.label.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSecondary = secondaryNavItems.filter(i => {
    // Hide Admin for non-admin users
    if (i.href === '/admin' && role !== 'admin') return false;
    return !search || i.label.toLowerCase().includes(search.toLowerCase());
  });

  /* ── NavLink ─────────────────────────────────────── */
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;
    // Extract key from href for animation data attribute
    const key = item.href.replace('/', '');

    const content = (
      <Link
        to={item.href}
        data-active={isActive ? key : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)]',
          collapsed ? 'h-10 w-10 justify-center mx-auto' : 'px-3 py-2.5 w-full',
          isActive
            ? 'bg-black/20 text-black font-semibold shadow-md shadow-black/10 border border-black/10'
            : 'text-black/65 hover:bg-black/10 hover:text-black border border-transparent'
        )}
      >
        {/* Active indicator bar */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-black/70" />
        )}

        {/* Active glow dot (collapsed) */}
        {isActive && collapsed && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-black/70 shadow-[0_0_6px_2px_rgba(0,0,0,.3)]" />
        )}

        {/* Icon */}
        <div className={cn(
          'nav-icon relative flex-shrink-0 flex items-center justify-center',
          isActive ? 'text-black' : 'text-black/60 group-hover:text-black',
          'transition-colors duration-200',
        )}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
        </div>

        {/* Label */}
        {!collapsed && (
          <span className="text-sm whitespace-nowrap leading-none">{item.label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge && (
          <span className={cn(
            'ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide leading-none',
            isActive
              ? 'bg-black/20 text-black'
              : 'bg-black/10 text-black/70'
          )}>
            {item.badge}
          </span>
        )}

        {/* Hover shimmer */}
        <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-black/5 to-transparent" />
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-foreground text-background shadow-xl"
          >
            {item.label}
            {item.badge && (
              <span className="ml-2 text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-black uppercase">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes sidebar-in  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fade-in     { from{opacity:0} to{opacity:1} }

        /* ── Intense icon animations ── */
        @keyframes icon-bounce {
          0%   { transform: scale(1)    translateY(0); }
          20%  { transform: scale(1.5)  translateY(-8px) rotate(-8deg); }
          40%  { transform: scale(.75)  translateY(4px)  rotate(6deg); }
          60%  { transform: scale(1.25) translateY(-4px) rotate(-4deg); }
          80%  { transform: scale(.9)   translateY(2px); }
          100% { transform: scale(1.15) translateY(0); }
        }
        @keyframes icon-spin {
          0%   { transform: rotate(0deg)   scale(1); }
          30%  { transform: rotate(220deg) scale(1.5); }
          70%  { transform: rotate(320deg) scale(0.8); }
          100% { transform: rotate(360deg) scale(1.2); }
        }
        @keyframes icon-pulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0px rgba(0,0,0,0)); }
          25%  { transform: scale(1.6);  filter: drop-shadow(0 0 6px rgba(0,0,0,.35)); }
          55%  { transform: scale(0.75); filter: drop-shadow(0 0 2px rgba(0,0,0,.2)); }
          80%  { transform: scale(1.3);  filter: drop-shadow(0 0 4px rgba(0,0,0,.25)); }
          100% { transform: scale(1.15); filter: drop-shadow(0 0 3px rgba(0,0,0,.2)); }
        }
        @keyframes icon-wiggle {
          0%   { transform: rotate(0deg)   scale(1); }
          15%  { transform: rotate(-25deg) scale(1.4); }
          35%  { transform: rotate(25deg)  scale(1.4); }
          55%  { transform: rotate(-18deg) scale(1.2); }
          70%  { transform: rotate(16deg)  scale(1.2); }
          85%  { transform: rotate(-8deg)  scale(1.15); }
          100% { transform: rotate(0deg)   scale(1.15); }
        }
        @keyframes icon-pop {
          0%   { transform: scale(1)    rotate(0deg); }
          20%  { transform: scale(0.4)  rotate(-15deg); }
          50%  { transform: scale(1.8)  rotate(10deg); }
          70%  { transform: scale(0.85) rotate(-5deg); }
          90%  { transform: scale(1.25) rotate(3deg); }
          100% { transform: scale(1.15) rotate(0deg); }
        }
        @keyframes icon-slide {
          0%   { transform: translateX(0)    scale(1); }
          25%  { transform: translateX(10px) scale(1.3) rotate(8deg); }
          50%  { transform: translateX(-8px) scale(1.2) rotate(-6deg); }
          75%  { transform: translateX(5px)  scale(1.15); }
          100% { transform: translateX(0)    scale(1.15); }
        }
        @keyframes icon-rise {
          0%   { transform: translateY(0)    scale(1); }
          30%  { transform: translateY(-10px) scale(1.4) rotate(-6deg); }
          55%  { transform: translateY(5px)   scale(0.85) rotate(4deg); }
          80%  { transform: translateY(-4px)  scale(1.2); }
          100% { transform: translateY(0)    scale(1.15); }
        }
        @keyframes icon-flash {
          0%,100% { transform: scale(1.15);   opacity:1; }
          20%     { transform: scale(1.7) rotate(15deg); opacity:.7; }
          40%     { transform: scale(.6)  rotate(-10deg); opacity:1; }
          60%     { transform: scale(1.4) rotate(5deg);  opacity:.85; }
          80%     { transform: scale(.9); opacity:1; }
        }

        .nav-item-in  { animation: sidebar-in .25s cubic-bezier(.4,0,.2,1) both; }
        .search-in    { animation: fade-in .2s ease both; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }

        /* Per-icon active animations — high intensity */
        [data-active="dashboard"]    .nav-icon { animation: icon-bounce .75s cubic-bezier(.34,1.56,.64,1) forwards; }
        [data-active="faturas"]      .nav-icon { animation: icon-pop    .65s cubic-bezier(.34,1.56,.64,1) forwards; }
        [data-active="clientes"]     .nav-icon { animation: icon-wiggle .7s  ease forwards; }
        [data-active="fornecedores"] .nav-icon { animation: icon-slide  .65s ease forwards; }
        [data-active="produtos"]     .nav-icon { animation: icon-bounce .75s cubic-bezier(.34,1.56,.64,1) forwards; }
        [data-active="documentos"]   .nav-icon { animation: icon-flash  .6s  ease forwards; }
        [data-active="relatorios"]   .nav-icon { animation: icon-rise   .7s  cubic-bezier(.34,1.56,.64,1) forwards; }
        [data-active="empresa"]      .nav-icon { animation: icon-pop    .65s cubic-bezier(.34,1.56,.64,1) forwards; }
        [data-active="configuracoes"].nav-icon { animation: icon-spin   .7s  cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex flex-col',
          'transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
          'bg-gradient-to-b from-primary via-primary to-primary/95',
          'border-r border-black/10',
          'shadow-[4px_0_24px_rgba(0,0,0,.12)]',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {/* ── Top glow line ── */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* ── Header ─────────────────────────────────── */}
        <div className={cn(
          'flex items-center h-16 px-3 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-black/10 border border-black/10 flex items-center justify-center shadow-inner hover:bg-black/15 transition-colors">
              <img src={logoFaktura} alt="Faktura" className="w-[22px] h-[22px] object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-black text-[15px] tracking-tight text-black leading-none">Faktura</span>
                <span className="text-[9px] text-black/50 font-bold uppercase tracking-[.18em] mt-0.5">Angola</span>
              </div>
            )}
          </div>

          {!collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-black/50 hover:text-black hover:bg-black/10 transition-all flex-shrink-0">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_2px_rgba(220,38,38,.4)]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Notificações</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── Search ─────────────────────────────────── */}
        {!collapsed && (
          <div className="px-3 mb-4 flex-shrink-0 search-in">
            <div className={cn(
              'relative flex items-center rounded-xl border transition-all duration-200',
              searchOpen
                ? 'bg-black/15 border-black/25 shadow-inner'
                : 'bg-black/8 border-black/10 hover:bg-black/12 hover:border-black/18'
            )}>
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-black/45 pointer-events-none flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => !search && setSearchOpen(false)}
                placeholder="Pesquisar…"
                className="w-full bg-transparent py-2 pl-8 pr-8 text-xs text-black placeholder:text-black/40 outline-none"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setSearchOpen(false); }}
                  className="absolute right-2 w-4 h-4 rounded-full bg-black/15 flex items-center justify-center hover:bg-black/25 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-black/70" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Nav ────────────────────────────────────── */}
        <nav className="flex-1 px-3 overflow-y-auto no-scrollbar space-y-5">
          <div>
            {!collapsed && !search && (
              <p className="px-3 mb-2 text-[9px] font-black text-black/35 uppercase tracking-[.16em]">
                Principal
              </p>
            )}
            <div className="space-y-0.5">
              {filteredMain.map((item, i) => (
                <div key={item.href} className="nav-item-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <NavLink item={item} />
                </div>
              ))}
              {filteredMain.length === 0 && (
                <p className="px-3 py-2 text-xs text-black/35 text-center">Sem resultados</p>
              )}
            </div>
          </div>

          <div className="mx-3 h-px bg-black/10 rounded-full" />

          <div>
            {!collapsed && !search && (
              <p className="px-3 mb-2 text-[9px] font-black text-black/35 uppercase tracking-[.16em]">
                Sistema
              </p>
            )}
            <div className="space-y-0.5">
              {filteredSecondary.map((item, i) => (
                <div key={item.href} className="nav-item-in" style={{ animationDelay: `${(filteredMain.length + i) * 30}ms` }}>
                  <NavLink item={item} />
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="flex-shrink-0 px-3 pb-3 pt-3 border-t border-black/10 space-y-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-black/8 border border-black/10 hover:bg-black/12 hover:border-black/18 transition-all group cursor-pointer">
              <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8 border border-black/20 ring-2 ring-transparent group-hover:ring-black/15 transition-all">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-black/15 text-black text-[11px] font-black">ML</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-600 border-2 border-primary shadow-[0_0_6px_2px_rgba(22,163,74,.35)]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-bold text-black leading-none truncate">Moisés Lucamba</span>
                <span className="text-[10px] text-black/50 mt-0.5 truncate">Administrador</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-black/50 hover:text-black hover:bg-black/10 transition-all flex-shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="relative cursor-pointer">
                    <Avatar className="h-9 w-9 border border-black/20 hover:ring-2 hover:ring-black/15 transition-all">
                      <AvatarFallback className="bg-black/15 text-black text-xs font-black">ML</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-600 border-2 border-primary" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-semibold">
                Moisés Lucamba · Admin
              </TooltipContent>
            </Tooltip>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center rounded-xl transition-all duration-200',
              'text-black/40 hover:text-black/80 hover:bg-black/8',
              'border border-transparent hover:border-black/10',
              collapsed ? 'h-9 justify-center' : 'h-9 px-3 gap-2',
            )}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs font-semibold">Recolher</span>}
            {!collapsed && (
              <kbd className="ml-auto text-[9px] bg-black/10 text-black/40 px-1.5 py-0.5 rounded font-mono">⌘B</kbd>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}