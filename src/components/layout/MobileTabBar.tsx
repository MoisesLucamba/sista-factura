import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { memo, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
} from 'lucide-react';

const tabs = [
  { icon: LayoutDashboard, label: 'Início',     href: '/dashboard'  },
  { icon: FileText,        label: 'Faturas',    href: '/faturas'    },
  { icon: Users,           label: 'Clientes',   href: '/clientes'   },
  { icon: Package,         label: 'Produtos',   href: '/produtos'   },
  { icon: BarChart3,       label: 'Relatórios', href: '/relatorios' },
] as const;

export const MobileTabBar = memo(function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = useCallback((href: string) => {
    navigate(href, { replace: false });
  }, [navigate]);

  return (
    <>
      <style>{`
        .tab-bar {
          position: relative;
          background: #0a0a0a;
          border-top: 1px solid #1f1f1f;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.6);
        }
        .tab-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #facc15, transparent);
          opacity: 0.5;
        }
        .tab-btn-active .tab-icon-wrap {
          background: #facc15;
          box-shadow: 0 0 12px 2px rgba(250,204,21,0.45);
        }
        .tab-btn-active .tab-icon-wrap svg {
          color: #0a0a0a !important;
        }
        .tab-btn-active .tab-label {
          color: #facc15;
          font-weight: 700;
        }
        .tab-btn-inactive .tab-icon-wrap svg {
          color: #525252;
        }
        .tab-btn-inactive .tab-label {
          color: #525252;
        }
        .tab-btn-inactive:active .tab-icon-wrap svg {
          color: #a3a3a3;
        }
      `}</style>

      <nav className="tab-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="flex items-center justify-around h-16 px-1 safe-bottom">
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
                  'flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-lg',
                  'touch-manipulation select-none transition-all duration-150 active:scale-90',
                  isActive ? 'tab-btn-active' : 'tab-btn-inactive',
                )}
              >
                <div className={cn(
                  'tab-icon-wrap flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200',
                )}>
                  <Icon
                    className="w-[18px] h-[18px] transition-colors duration-200"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className="tab-label text-[9.5px] leading-tight tracking-wide transition-colors duration-200">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
});