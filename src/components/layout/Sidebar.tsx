import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Truck,
  Receipt,
  Sparkles,
  Search,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoFaktura from '@/assets/logo-faktura.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Faturas', href: '/faturas' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: Truck, label: 'Fornecedores', href: '/fornecedores' },
  { icon: Package, label: 'Produtos', href: '/produtos' },
  { icon: Receipt, label: 'Documentos', href: '/documentos' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
];

const secondaryNavItems: NavItem[] = [
  { icon: Building2, label: 'Empresa', href: '/empresa' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          'group overflow-hidden mb-1',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-foreground rounded-r-full" />
        )}
        
        <div className={cn(
          'relative z-10 flex items-center justify-center transition-transform duration-200',
          isActive && 'scale-105'
        )}>
          <Icon className={cn(
            'w-5 h-5 flex-shrink-0 transition-colors',
            isActive ? 'text-primary-foreground' : 'group-hover:text-primary'
          )} />
        </div>

        {!collapsed && (
          <span className={cn(
            'font-medium text-sm whitespace-nowrap transition-opacity duration-200',
            isActive ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
          )}>
            {item.label}
          </span>
        )}

        {!collapsed && item.badge && (
          <span className={cn(
            "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter",
            isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="font-medium"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col',
        'bg-card border-r border-border/40 shadow-sm transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 mb-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-inner">
            <img 
              src={logoFaktura} 
              alt="Logo" 
              className="w-6 h-6 object-contain brightness-0 invert"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">Faktura</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Angola</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar (Visual Only) */}
      {!collapsed && (
        <div className="px-4 mb-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full bg-muted/50 border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/30 transition-all outline-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar">
        <div className="mb-6">
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Menu Principal
            </p>
          )}
          <div className="space-y-0.5">
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Sistema
            </p>
          )}
          <div className="space-y-0.5">
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto p-3 border-t border-border/40">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-transparent hover:border-border/40 transition-all group">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ML</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Moisés Lucamba</span>
              <span className="text-[10px] text-muted-foreground truncate">Admin</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center p-1">
                <Avatar className="h-9 w-9 border border-border/50 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ML</AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Perfil: Moisés Lucamba</TooltipContent>
          </Tooltip>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full mt-2 h-9 rounded-lg text-muted-foreground hover:text-foreground transition-all',
            collapsed ? 'justify-center px-0' : 'justify-between px-3'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <span className="text-xs font-medium">Recolher</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}