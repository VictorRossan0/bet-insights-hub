import { NavLink, Outlet, Link, useParams } from "react-router-dom";
import { BarChart3, Home, Trophy, Users, Menu, X, History, Swords, Shield, LogOut, LogIn, FlaskConical } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import LigaTabs from "@/components/LigaTabs";
import SubNav from "@/components/SubNav";

const navItems = [
  { path: "", icon: Home, label: "Dashboard", end: true },
  { path: "jogos", icon: Trophy, label: "Jogos" },
  { path: "historico", icon: History, label: "Histórico" },
  { path: "times", icon: Users, label: "Times" },
  { path: "confronto", icon: Swords, label: "Confronto H2H" },
  { path: "backtesting", icon: FlaskConical, label: "Backtesting" },
];

export default function Layout({ showLigaNav = true }: { showLigaNav?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4 gap-2 fixed h-screen">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-border flex items-center px-4">
        <button onClick={() => setMobileOpen(true)} className="text-foreground" aria-label="Abrir menu de navegação">
          <Menu className="w-5 h-5" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-bet-green" />
          <span className="font-display text-lg tracking-wide">BetAnalytics</span>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border p-4 z-50 lg:hidden"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar menu de navegação">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 lg:ml-64 mt-14 lg:mt-0 overflow-x-hidden overflow-y-auto h-[calc(100vh-3.5rem)] lg:h-screen">
        {showLigaNav && (
          <>
            <LigaTabs />
            <SubNav />
          </>
        )}
        <Outlet />
      </main>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin, signOut } = useAuth();
  const { ligaSlug } = useParams();
  const base = ligaSlug ? `/${ligaSlug}` : "/bra.1";

  return (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
        <BarChart3 className="w-7 h-7 text-bet-green" />
        <div>
          <div className="font-display text-xl tracking-wide leading-tight">BetAnalytics</div>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Multi-Liga</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ path, icon: Icon, label, end }) => {
          const to = path ? `${base}/${path}` : base;
          return (
            <NavLink
              key={path || "index"}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-border space-y-2">
        {user ? (
          <button
            onClick={() => { onNavigate?.(); void signOut(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
            {isAdmin && <span className="ml-auto text-[9px] uppercase tracking-wider text-bet-green">Admin</span>}
          </button>
        ) : (
          <Link
            to="/auth"
            onClick={onNavigate}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" /> Login Admin
          </Link>
        )}
        <p className="text-[10px] text-muted-foreground text-center">Dados via SofaScore • Análise por IA</p>
      </div>
    </>
  );
}
