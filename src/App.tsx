import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import PatientPipeline from "@/pages/PatientPipeline";
import BudgetPipeline from "@/pages/BudgetPipeline";
import Budgets from "@/pages/Budgets";
import Procedures from "@/pages/Procedures";
import SettingsPage from "@/pages/Settings";
import WhatsApp from "@/pages/WhatsApp";
import Agenda from "@/pages/Agenda";
import Automations from "@/pages/Automations";
import Financial from "@/pages/Financial";
import Reports from "@/pages/Reports";
import NpsSatisfaction from "@/pages/NpsSatisfaction";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminClinicDetail from "@/pages/AdminClinicDetail";
import AdminLojas from "@/pages/AdminLojas";
import AdminLojaDetail from "@/pages/AdminLojaDetail";
import AdminLojaCatalogo from "@/pages/AdminLojaCatalogo";
import AdminLojaLeads from "@/pages/AdminLojaLeads";
import AdminLojaConversas from "@/pages/AdminLojaConversas";
import AdminLojaFollowups from "@/pages/AdminLojaFollowups";
import AdminLojaVisitas from "@/pages/AdminLojaVisitas";
import AdminStats from "@/pages/AdminStats";
import LojaLeads from "@/pages/LojaLeads";
import LojaCatalogo from "@/pages/LojaCatalogo";
import LojaFollowups from "@/pages/LojaFollowups";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RootRedirect() {
  const { loading, session, defaultRoute } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRoute} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WhiteLabelProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />
              <Route element={<ProtectedRoute requiredMode="client"><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<LojaLeads />} />
                <Route path="/catalogo" element={<LojaCatalogo />} />
                <Route path="/followups" element={<LojaFollowups />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:id" element={<PatientDetail />} />
                <Route path="/pipeline/patients" element={<PatientPipeline />} />
                <Route path="/pipeline/budgets" element={<BudgetPipeline />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/procedures" element={<Procedures />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/whatsapp" element={<WhatsApp />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/nps" element={<NpsSatisfaction />} />
              </Route>
              <Route path="/admin" element={<ProtectedRoute requiredMode="admin" requiredRole="platform_admin"><AppLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
              </Route>
              <Route path="/admin/clinic/:id" element={<ProtectedRoute requiredMode="admin" requiredRole="platform_admin"><AppLayout /></ProtectedRoute>}>
                <Route index element={<AdminClinicDetail />} />
              </Route>
              <Route path="/admin/stats" element={<ProtectedRoute requiredMode="admin" requiredRole="platform_admin"><AppLayout /></ProtectedRoute>}>
                <Route index element={<AdminStats />} />
              </Route>
              <Route path="/admin/lojas" element={<ProtectedRoute requiredMode="admin" requiredRole="platform_admin"><AppLayout /></ProtectedRoute>}>
                <Route index element={<AdminLojas />} />
                <Route path=":id" element={<AdminLojaDetail />} />
                <Route path=":id/catalogo" element={<AdminLojaCatalogo />} />
                <Route path=":id/leads" element={<AdminLojaLeads />} />
                <Route path=":id/conversas" element={<AdminLojaConversas />} />
                <Route path=":id/followups" element={<AdminLojaFollowups />} />
                <Route path=":id/visitas" element={<AdminLojaVisitas />} />
              </Route>
              <Route path="/settings" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
