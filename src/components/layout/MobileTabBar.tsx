import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { memo, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Menu,
} from 'lucide-react';

const tabs = [
  { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
  { icon: FileText, label: 'Faturas', href: '/faturas' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: Package, label: 'Produtos', href: '/produtos' },
  { icon: Menu, label: 'Mais', href: '/configuracoes' },
] as const;

export const MobileTabBar = memo(function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = useCallback((href: string) => {
    navigate(href, { replace: false });
  }, [navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/60 shadow-[0_-2px_10px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-14 px-1 safe-bottom">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || 
            (tab.href !== '/dashboard' && location.pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => handleNav(tab.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg',
                'touch-manipulation select-none active:scale-95 transition-transform',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-9 h-6 rounded-full',
                isActive && 'bg-primary/10'
              )}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
