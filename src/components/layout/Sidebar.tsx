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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent group',
          isActive 
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
            : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-transform duration-200',
          'group-hover:scale-110',
          isActive && 'text-sidebar-primary-foreground'
        )} />
        {!collapsed && (
          <span className={cn(
            'font-medium text-sm whitespace-nowrap',
            isActive && 'text-sidebar-primary-foreground'
          )}>
            {item.label}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
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
        'fixed left-0 top-0 z-40 h-screen',
        'bg-sidebar border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out',
        'flex flex-col',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display font-bold text-sidebar-foreground text-lg leading-tight">
              Faktura
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Angola
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
          {secondaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'justify-center px-0' : 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
