import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider, type AppRole } from "@/contexts/AuthContext";
import { ActiveAccountProvider } from "@/contexts/ActiveAccountContext";
import { GuestProvider } from "@/contexts/GuestContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Explorar = lazy(() => import("./pages/Explorar"));
const Login = lazy(() => import("./pages/Login"));
const Registar = lazy(() => import("./pages/Registar"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EnviarSaft = lazy(() => import("./pages/EnviarSaft"));
const DocumentosEmpresa = lazy(() => import("./pages/DocumentosEmpresa"));
const PedidosCredito = lazy(() => import("./pages/PedidosCredito"));
const Sazonalidade = lazy(() => import("./pages/Sazonalidade"));
const Seguros = lazy(() => import("./pages/Seguros"));
const MinhaEmpresa = lazy(() => import("./pages/MinhaEmpresa"));
const PainelBanco = lazy(() => import("./pages/PainelBanco"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const EmpresaMembros = lazy(() => import("./pages/EmpresaMembros"));
const Perfil = lazy(() => import("./pages/Perfil"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PrivatePage = ({
  children,
  allowedRoles,
  blockGuest = false,
}: {
  children: ReactNode;
  allowedRoles?: AppRole[];
  blockGuest?: boolean;
}) => (
  <ProtectedRoute allowedRoles={allowedRoles} blockGuest={blockGuest}>
    {children}
  </ProtectedRoute>
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);
const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <AuthProvider>
            <ActiveAccountProvider>
              <GuestProvider>
                <Suspense fallback={<PageLoader />}>
                  <CookieConsentBanner />
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/simulador" element={<Simulador />} />
                    <Route path="/explorar" element={<Explorar />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registar" element={<Registar />} />
                    <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="/termos" element={<TermosDeUso />} />
                    <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                    <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
                    <Route path="/saft" element={<PrivatePage><EnviarSaft /></PrivatePage>} />
                    <Route path="/documentos" element={<PrivatePage><DocumentosEmpresa /></PrivatePage>} />
                    <Route path="/credito" element={<PrivatePage><PedidosCredito /></PrivatePage>} />
                    <Route path="/sazonalidade" element={<PrivatePage><Sazonalidade /></PrivatePage>} />
                    <Route path="/seguros" element={<PrivatePage><Seguros /></PrivatePage>} />
                    <Route path="/empresa" element={<PrivatePage><MinhaEmpresa /></PrivatePage>} />
                    <Route path="/empresa/membros" element={<PrivatePage><EmpresaMembros /></PrivatePage>} />
                    <Route path="/banco" element={<PrivatePage allowedRoles={["banco"]} blockGuest><PainelBanco /></PrivatePage>} />
                    <Route path="/auditoria" element={<PrivatePage allowedRoles={["banco"]} blockGuest><Auditoria /></PrivatePage>} />
                    <Route path="/admin" element={<PrivatePage allowedRoles={["admin"]} blockGuest><AdminDashboard /></PrivatePage>} />
                    <Route path="/configuracoes" element={<PrivatePage><Configuracoes /></PrivatePage>} />
                    <Route path="/notificacoes" element={<PrivatePage><Notificacoes /></PrivatePage>} />
                    <Route path="/perfil" element={<PrivatePage><Perfil /></PrivatePage>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </GuestProvider>
            </ActiveAccountProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
