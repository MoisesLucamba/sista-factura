import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  maxWidth?: 'default' | 'full' | 'xl' | '2xl' | '4xl' | '6xl';
  padding?: 'default' | 'none' | 'sm' | 'lg' | 'xl';
  loading?: boolean;
}

export function MainLayout({ 
  children, 
  className,
  title,
  description,
  maxWidth = 'default',
  padding = 'default',
  loading = false,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkSidebarWidth = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarCollapsed(sidebar.clientWidth < 100);
      }
    };
    const observer = new ResizeObserver(checkSidebarWidth);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar);
      checkSidebarWidth();
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop((window.pageYOffset || document.documentElement.scrollTop) > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMobileSidebarOpen(false); }, [children]);

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileSidebarOpen]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const maxWidthClass = {
    full: 'max-w-full', xl: 'max-w-screen-xl', '2xl': 'max-w-screen-2xl',
    '4xl': 'max-w-[1600px]', '6xl': 'max-w-[1800px]', default: 'max-w-[1400px]',
  }[maxWidth];

  const paddingClass = {
    none: 'p-0', sm: 'p-3 sm:p-4', lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10 lg:p-12', default: 'p-4 sm:p-6 lg:p-8',
  }[padding];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile sidebar overlay */}
      {isMobile && isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full animate-in slide-in-from-left duration-300">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className={cn(
        'relative transition-all duration-300 ease-in-out min-h-screen flex flex-col',
        !isMobile && (sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'),
        isMobile && 'pb-20' // space for tabbar
      )}>
        {/* Header with mobile menu button */}
        <div className="sticky top-0 z-40">
          {isMobile && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          )}
          <Header />
        </div>

        <main className="flex-1 relative">
          {(title || description) && (
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-6', maxWidthClass)}>
                <div className="space-y-2">
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">{description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={cn('mx-auto', maxWidthClass, paddingClass)}>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium text-foreground">A carregar...</p>
                  <p className="text-sm text-muted-foreground">Por favor aguarde</p>
                </div>
              </div>
            ) : (
              <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-500', className)}>
                {children}
              </div>
            )}
          </div>
        </main>

        {/* Footer - hidden on mobile */}
        {!isMobile && (
          <footer className="mt-auto border-t bg-muted/30">
            <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-6', maxWidthClass)}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Sistema de Faturação. Todos os direitos reservados.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Versão 2.0.0 - Desenvolvido em Angola 🇦🇴</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Documentação</a>
                  <span className="text-muted-foreground/50">•</span>
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Suporte</a>
                  <span className="text-muted-foreground/50">•</span>
                  <a href="#" className="hover:text-primary transition-colors hover:underline">Privacidade</a>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Mobile Tab Bar */}
      {isMobile && <MobileTabBar />}

      {/* Scroll to top */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className={cn(
            'fixed z-50 h-12 w-12 rounded-full shadow-lg',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'animate-in slide-in-from-bottom-2 duration-300',
            isMobile ? 'bottom-24 right-4' : 'bottom-6 right-6'
          )}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}

      {!isMobile && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
      )}
    </div>
  );
}