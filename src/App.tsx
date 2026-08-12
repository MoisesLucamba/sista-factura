import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestProvider } from "@/contexts/GuestContext";
import { ActiveAccountProvider } from "@/contexts/ActiveAccountContext";

import { AccountSelectorModal } from "@/components/account/AccountSelectorModal";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Empresa = lazy(() => import("./pages/MinhaEmpresa"));
const EnviarSaft = lazy(() => import("./pages/EnviarSaft"));
const PedidosCredito = lazy(() => import("./pages/PedidosCredito"));
const Sazonalidade = lazy(() => import("./pages/Sazonalidade"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Login = lazy(() => import("./pages/Login"));
const Registar = lazy(() => import("./pages/Registar"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Perfil = lazy(() => import("./pages/Perfil"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const EmpresaMembros = lazy(() => import("./pages/EmpresaMembros"));
const LandingAnalytics = lazy(() => import("./pages/LandingAnalytics"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Explorar = lazy(() => import("./pages/Explorar"));
const Seguros = lazy(() => import("./pages/Seguros"));
const PainelBanco = lazy(() => import("./pages/PainelBanco"));
const Auditoria = lazy(() => import("./pages/Auditoria"));

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
        <AuthProvider>
          <GuestProvider>
          <ActiveAccountProvider>

          <Toaster />
          <Sonner position="top-right" richColors />
          <AccountSelectorModal />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registar" element={<Registar />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/simulador" element={<Simulador />} />
            <Route path="/explorar" element={<Explorar />} />

            {/* Protected routes */}
            <Route

              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saft"
              element={
                <ProtectedRoute>
                  <EnviarSaft />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credito"
              element={
                <ProtectedRoute>
                  <PedidosCredito />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sazonalidade"
              element={
                <ProtectedRoute>
                  <Sazonalidade />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa"
              element={
                <ProtectedRoute>
                  <Empresa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/membros"
              element={
                <ProtectedRoute>
                  <EmpresaMembros />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seguros"
              element={
                <ProtectedRoute>
                  <Seguros />
                </ProtectedRoute>
              }
            />
            <Route
              path="/banco"
              element={
                <ProtectedRoute allowedRoles={['banco']} blockGuest>
                  <PainelBanco />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditoria"
              element={
                <ProtectedRoute allowedRoles={['admin', 'banco']} blockGuest>
                  <Auditoria />
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notificacoes"
              element={
                <ProtectedRoute>
                  <Notificacoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']} blockGuest>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']} blockGuest>
                  <LandingAnalytics />
                </ProtectedRoute>
              }
            />


            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </Suspense>
          </BrowserRouter>
          </ActiveAccountProvider>
          </GuestProvider>

        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
