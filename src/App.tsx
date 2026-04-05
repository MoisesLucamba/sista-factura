import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardComprador = lazy(() => import("./pages/DashboardComprador"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Faturas = lazy(() => import("./pages/Faturas"));
const NovaFatura = lazy(() => import("./pages/NovaFatura"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Empresa = lazy(() => import("./pages/Empresa"));
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
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Carteira = lazy(() => import("./pages/Carteira"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const PagarLink = lazy(() => import("./pages/PagarLink"));
const LojaMerchant = lazy(() => import("./pages/LojaMerchant"));
const ScanComprador = lazy(() => import("./pages/ScanComprador"));
const HostStoreDashboard = lazy(() => import("./pages/HostStoreDashboard"));
const StoreDirectory = lazy(() => import("./pages/StoreDirectory"));
const POS = lazy(() => import("./pages/POS"));
const BuyerScanInvoice = lazy(() => import("./pages/BuyerScanInvoice"));
const GestaoStock = lazy(() => import("./pages/GestaoStock"));

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
          <Toaster />
          <Sonner position="top-right" richColors />
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
            <Route path="/pagar/:code" element={<PagarLink />} />
            <Route path="/loja/:merchantId" element={<LojaMerchant />} />
            <Route path="/scan/:fakturaId" element={<ScanComprador />} />
            <Route
              path="/aprovacao-pendente"
              element={
                <ProtectedRoute allowedRoles={['comprador']}>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />
            
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
              path="/comprador"
              element={
                <ProtectedRoute allowedRoles={['comprador']}>
                  <DashboardComprador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute>
                  <Produtos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faturas"
              element={
                <ProtectedRoute>
                  <Faturas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faturas/nova"
              element={
                <ProtectedRoute>
                  <NovaFatura />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute allowedRoles={['admin', 'contador']}>
                  <Relatorios />
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
              path="/fornecedores"
              element={
                <ProtectedRoute>
                  <Fornecedores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documentos"
              element={
                <ProtectedRoute>
                  <Documentos />
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
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
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
              path="/carteira"
              element={
                <ProtectedRoute>
                  <Carteira />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pagamentos"
              element={
                <ProtectedRoute>
                  <Pagamentos />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/lojas"
              element={
                <ProtectedRoute>
                  <HostStoreDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/directorio"
              element={
                <ProtectedRoute>
                  <StoreDirectory />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/scan-despesas"
              element={
                <ProtectedRoute allowedRoles={['comprador']}>
                  <BuyerScanInvoice />
                </ProtectedRoute>
              }
              />
            </ProtectedRoute>
              }
            />
            <Route
              path="/gestao-stock"
              element={
                <ProtectedRoute>
                  <GestaoStock />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
