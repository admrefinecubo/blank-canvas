import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, GitBranch, FileText, Package, Settings,
  ChevronLeft, ChevronRight, Search, MessageSquare, Calendar,
  DollarSign, BarChart3, ChevronDown, Star, Zap, Menu, X, Store,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clientes / Leads", url: "/patients", icon: Users },
  {
    title: "Pipeline", icon: GitBranch,
    children: [
      { title: "Clientes", url: "/pipeline/patients" },
      { title: "Orçamentos", url: "/pipeline/budgets" },
    ],
  },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
  { title: "Agenda / Visitas", url: "/agenda", icon: Calendar },
  { title: "Financeiro", url: "/financial", icon: DollarSign },
  { title: "Orçamentos", url: "/budgets", icon: FileText },
  { title: "Catálogo de Produtos", url: "/procedures", icon: Package },
  { title: "Automações", url: "/automations", icon: Zap },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Pós-Venda", url: "/nps", icon: Star },
  { title: "Configurações", url: "/settings", icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Clientes / Leads",
  "/pipeline/patients": "Pipeline / Clientes",
  "/pipeline/budgets": "Pipeline / Orçamentos",
  "/budgets": "Orçamentos",
  "/procedures": "Catálogo de Produtos",
  "/settings": "Configurações",
  "/whatsapp": "WhatsApp",
  "/agenda": "Agenda / Visitas",
  "/automations": "Automações",
  "/financial": "Financeiro",
  "/reports": "Relatórios",
  "/nps": "Pós-Venda / Satisfação",
  "/admin/lojas": "Lojas",
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [currentPath, isMobile]);

  const breadcrumb = breadcrumbMap[currentPath] || currentPath.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");
  const { settings } = useWhiteLabel();
  const { user, roles, isPlatformAdmin, clinicId, impersonatedClinicId, clearImpersonation, signOut } = useAuth();
  const queryClient = useQueryClient();
  const prevClinicIdRef = useRef<string | null>(clinicId ?? null);
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const userRole = roles[0]?.role;

  useEffect(() => {
    if (clinicId !== prevClinicIdRef.current && clinicId !== null) {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'impersonated-clinic' });
      prevClinicIdRef.current = clinicId;
    }
  }, [clinicId, queryClient]);

  const { data: impersonatedClinic } = useQuery({
    queryKey: ["impersonated-clinic", impersonatedClinicId],
    queryFn: async () => {
      if (!impersonatedClinicId) return null;
      const { data } = await supabase.from("clinics").select("name").eq("id", impersonatedClinicId).single();
      return data;
    },
    enabled: !!impersonatedClinicId,
  });

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
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 overflow-hidden shadow-sm",
                settings.logoUrl ? "bg-transparent" : "bg-primary"
              )}>
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-primary-foreground">{settings.clinicName.charAt(0)}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold tracking-tight">{settings.clinicName}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">{settings.clinicSubtitle}</span>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shadow-sm",
                settings.logoUrl ? "bg-transparent" : "bg-primary"
              )}>
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-primary-foreground">{settings.clinicName.charAt(0)}</span>
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/60" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <div key={item.title}>
                    <button
                      onClick={() => setPipelineOpen(!pipelineOpen)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", pipelineOpen && "rotate-180")} />
                        </>
                      )}
                    </button>
                    {!collapsed && pipelineOpen && (
                      <div className="ml-8 mt-1 flex flex-col gap-0.5 border-l-2 border-border/40 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.url}
                            to={child.url}
                            className="rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                            activeClassName="text-primary font-medium bg-primary/8"
                          >
                            {child.title}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.url}
                  to={item.url!}
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
              );
            })}
          </div>
        </nav>

        {/* Admin Link */}
        {!collapsed && isPlatformAdmin && (
          <>
            <div className="mx-5 h-px bg-border/40" />
            <div className="px-3 py-2">
              <Link
                to="/admin"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-muted-foreground/60 transition-all hover:bg-accent hover:text-foreground"
              >
                <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.8} />
                Painel Admin
              </Link>
              <Link
                to="/admin/lojas"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-muted-foreground/60 transition-all hover:bg-accent hover:text-foreground"
              >
                <Store className="h-3.5 w-3.5" strokeWidth={1.8} />
                Lojas
              </Link>
            </div>
          </>
        )}

        {/* Footer tagline */}
        {!collapsed && (
          <div className="px-5 py-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/25 font-medium">
              LojaADS — IA de Vendas
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
                <span className="text-[10px] text-muted-foreground/70 capitalize">{userRole?.replace('_', ' ') || 'Usuário'}</span>
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
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch />
    </div>
  );
}