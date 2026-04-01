import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Home, Trophy, Users, Menu, X, History, Swords, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/jogos', icon: Trophy, label: 'Jogos' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/times', icon: Users, label: 'Times' },
  { to: '/confronto', icon: Swords, label: 'Confronto H2H' },
  { to: '/apostas', icon: TrendingUp, label: 'Apostas' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar p-4 gap-2 fixed h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-border flex items-center px-4">
        <button onClick={() => setMobileOpen(true)} className="text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-bet-green" />
          <span className="font-display text-lg tracking-wide">BetAnalytics</span>
        </div>
      </div>

      {/* Mobile Drawer */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border p-4 z-50 lg:hidden"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 min-w-0 lg:ml-64 mt-14 lg:mt-0 overflow-x-hidden overflow-y-auto h-[calc(100vh-3.5rem)] lg:h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
        <BarChart3 className="w-7 h-7 text-bet-green" />
        <div>
          <h1 className="font-display text-xl tracking-wide leading-tight">BetAnalytics</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Brasileirão 2026</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Dados via SofaScore • Análise por IA
        </p>
      </div>
    </>
  );
}
