import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';

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
  const [isScrolled, setIsScrolled] = useState(false);

  // Track sidebar state changes
  useEffect(() => {
    const checkSidebarWidth = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const isCollapsed = sidebar.clientWidth < 100;
        setSidebarCollapsed(isCollapsed);
      }
    };

    const observer = new ResizeObserver(checkSidebarWidth);
    const sidebar = document.querySelector('aside');
    
    if (sidebar) {
      observer.observe(sidebar);
      checkSidebarWidth(); // Initial check
    }

    return () => observer.disconnect();
  }, []);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 400);
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [children]);

  // Prevent scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'full':
        return 'max-w-full';
      case 'xl':
        return 'max-w-screen-xl';
      case '2xl':
        return 'max-w-screen-2xl';
      case '4xl':
        return 'max-w-[1600px]';
      case '6xl':
        return 'max-w-[1800px]';
      default:
        return 'max-w-[1400px]';
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 'p-0';
      case 'sm':
        return 'p-3 sm:p-4';
      case 'lg':
        return 'p-6 sm:p-8';
      case 'xl':
        return 'p-8 sm:p-10 lg:p-12';
      default:
        return 'p-4 sm:p-6 lg:p-8';
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={cn(
          'relative transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
          'min-h-screen flex flex-col'
        )}
      >
        {/* Header */}
        <Header 
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          isScrolled={isScrolled}
        />

        {/* Main content */}
        <main className="flex-1 relative">
          {/* Page header if title provided */}
          {(title || description) && (
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className={cn(
                'mx-auto px-4 sm:px-6 lg:px-8 py-6',
                getMaxWidth()
              )}>
                <div className="space-y-2">
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content wrapper */}
          <div className={cn(
            'mx-auto',
            getMaxWidth(),
            getPadding()
          )}>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium text-foreground">A carregar...</p>
                  <p className="text-sm text-muted-foreground">Por favor aguarde</p>
                </div>
              </div>
            ) : (
              <div className={cn(
                'animate-in fade-in slide-in-from-bottom-4 duration-500',
                className
              )}>
                {children}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t bg-muted/30">
          <div className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8 py-6',
            getMaxWidth()
          )}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Sistema de Faturação. Todos os direitos reservados.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Versão 2.0.0 - Desenvolvido em Angola 🇦🇴
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Documentação
                </a>
                <span className="text-muted-foreground/50">•</span>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Suporte
                </a>
                <span className="text-muted-foreground/50">•</span>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Privacidade
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className={cn(
            'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'animate-in slide-in-from-bottom-2 duration-300',
            'hover:scale-110 active:scale-95 transition-transform'
          )}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
    </div>
  );
}