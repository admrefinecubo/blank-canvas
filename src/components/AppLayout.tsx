import { useState, useEffect, cloneElement } from "react";
import { useOutlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Users, Package, Settings,
  ChevronLeft, ChevronRight, Search, MessageSquare, Calendar,
  BarChart3, Menu, X, Store, ShieldCheck, Workflow,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const clientNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clientes / Leads", url: "/leads", icon: Users },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
  { title: "Catálogo", url: "/catalogo", icon: Package },
  { title: "Agenda / Visitas", url: "/visitas", icon: Calendar },
  { title: "Follow-ups", url: "/followups", icon: Workflow },
  { title: "Campanhas", url: "/campanhas", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const adminNavItems = [
  { title: "Visão geral", url: "/admin", icon: ShieldCheck },
  { title: "Lojas", url: "/admin/lojas", icon: Store },
  { title: "Estatísticas", url: "/admin/stats", icon: BarChart3 },
  { title: "Implantação / Equipe", url: "/settings", icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Clientes / Leads",
  "/catalogo": "Catálogo",
  "/configuracoes": "Configurações",
  "/followups": "Follow-ups",
  "/visitas": "Visitas à Loja",
  "/campanhas": "Campanhas",
  "/patients": "Clientes / Leads",
  "/settings": "Configurações",
  "/whatsapp": "WhatsApp",
  "/admin": "Visão geral",
  "/admin/lojas": "Lojas",
  "/admin/stats": "Estatísticas",
};

// Freezes the outlet content at mount time so AnimatePresence exit works cleanly
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(() => outlet);
  return frozen;
}

const FrozenRoute = motion.create(FrozenOutlet);

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [currentPath, isMobile]);

  const breadcrumb = breadcrumbMap[currentPath] || currentPath.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");
  const { user, roles, isPlatformAdmin, appMode, defaultRoute, impersonatedClinicId, clearImpersonation, signOut, activeLojaId } = useAuth();
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const userRole = roles[0]?.role;
  const navItems = appMode === 'admin' ? adminNavItems : clientNavItems;

  const { data: impersonatedClinic } = useQuery({
    queryKey: ["impersonated-clinic", impersonatedClinicId],
    queryFn: async () => {
      if (!impersonatedClinicId) return null;
      const { data } = await supabase.from("clinics").select("name").eq("id", impersonatedClinicId).single();
      return data;
    },
    enabled: !!impersonatedClinicId,
  });

  const { data: activeLoja } = useQuery({
    queryKey: ["active-loja-branding", activeLojaId],
    queryFn: async () => {
      if (!activeLojaId) return null;
      const { data, error } = await supabase.from("lojas").select("nome_loja").eq("id", activeLojaId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: appMode === "client" && !!activeLojaId,
  });

  useEffect(() => {
    if (appMode === "client" && activeLoja?.nome_loja) {
      document.title = `CRM ‒ ${activeLoja.nome_loja}`;
    } else if (appMode === "admin") {
      document.title = "LojaADS ‒ Admin";
    } else {
      document.title = "CRM ‒ LojaADS";
    }
  }, [appMode, activeLoja?.nome_loja]);

  const ImpersonationBanner = () => (
    <div className="flex h-10 items-center justify-center gap-4 bg-primary text-sm font-medium text-primary-foreground">
      <Eye className="h-4 w-4" />
      Visualizando como: {impersonatedClinic?.name || "Loja"}
      <Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => clearImpersonation()}>
        Sair da visualização
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar transition-all duration-300 ease-in-out",
          isMobile
            ? cn("fixed inset-y-0 left-0 z-50 w-[260px] transform shadow-2xl", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")
            : collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo area */}
        <div className="flex h-[72px] items-center px-5">
          {!collapsed ? (
            <Link to={defaultRoute} className="flex items-center gap-3 group">
              <img 
                src="/logo-lojaads.png" 
                alt="LojaADS" 
                className="h-10 w-10 object-contain transition-transform group-hover:scale-105 invert dark:invert-0" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold tracking-tight">LojaADS</span>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">CRM</span>
                </div>
                {!isPlatformAdmin && appMode === "client" && activeLoja?.nome_loja ? (
                  <>
                    <span className="mt-2 h-px w-full bg-border/60" />
                    <span className="pt-2 text-[11px] font-medium text-muted-foreground">🏪 Loja: {activeLoja.nome_loja}</span>
                  </>
                ) : null}
              </div>
            </Link>
          ) : (
            <Link to={defaultRoute} className="mx-auto">
              <img 
                src="/logo-lojaads.png" 
                alt="LojaADS" 
                className="h-10 w-10 object-contain invert dark:invert-0" 
              />
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/60" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-primary/10 text-primary font-semibold"
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1">{item.title}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Admin shortcut while impersonating */}
        {!collapsed && isPlatformAdmin && appMode === 'client' && (
          <>
            <div className="mx-5 h-px bg-border/40" />
            <div className="px-3 py-2">
              <Link
                to="/admin"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-muted-foreground/60 transition-all hover:bg-accent hover:text-foreground"
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                Voltar ao admin
              </Link>
            </div>
          </>
        )}

        {/* Footer tagline */}
        {!collapsed && (
          <div className="px-5 py-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/25 font-medium">
              {appMode === 'admin' ? 'LojaADS — Admin' : 'LojaADS — CRM'}
            </p>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className={cn("border-t border-border/40 px-3 py-3", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground rounded-xl"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Impersonation Banner */}
        {isPlatformAdmin && impersonatedClinicId && <ImpersonationBanner />}

        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-sm px-5 md:px-8">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
            <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">{breadcrumb}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-muted-foreground text-xs hidden sm:flex rounded-xl border-border/60 bg-background/50"
              onClick={() => document.dispatchEvent(new CustomEvent("open-global-search"))}
            >
              <Search className="h-3.5 w-3.5" />
              Buscar...
              <kbd className="hidden md:inline-flex h-5 items-center rounded-md border border-border bg-muted/50 px-1 font-mono text-[10px]">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden rounded-xl"
              onClick={() => document.dispatchEvent(new CustomEvent("open-global-search"))}>
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <NotificationsDropdown />
            <div className="hidden md:block h-6 w-px bg-border/40" />
            <div className="hidden md:flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                {userInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium leading-tight">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground/70 capitalize">{appMode === 'admin' ? 'admin' : (userRole?.replace('_', ' ') || 'Usuário')}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs hidden md:inline">Sair</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-5 md:p-8">
          <AnimatePresence mode="wait">
            <FrozenRoute
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch />
    </div>
  );
}