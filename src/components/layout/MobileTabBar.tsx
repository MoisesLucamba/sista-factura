import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
} from 'lucide-react';

const tabs = [
  { icon: LayoutDashboard, label: 'Início', href: '/' },
  { icon: FileText, label: 'Faturas', href: '/faturas' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: Package, label: 'Produtos', href: '/produtos' },
  { icon: Settings, label: 'Mais', href: '/configuracoes' },
];

export function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/60 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 px-1 safe-bottom">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || 
            (tab.href !== '/' && location.pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-all',
                isActive && 'bg-primary/10'
              )}>
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
