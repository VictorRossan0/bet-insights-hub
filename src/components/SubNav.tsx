import { NavLink } from "react-router-dom";
import { Home, Trophy, History, Users, Swords, FlaskConical } from "lucide-react";
import { useLiga } from "@/contexts/LigaContext";
import { cn } from "@/lib/utils";

const subItems = [
  { path: "", icon: Home, label: "Painel", end: true },
  { path: "jogos", icon: Trophy, label: "Jogos" },
  { path: "historico", icon: History, label: "Histórico" },
  { path: "times", icon: Users, label: "Times" },
  { path: "confronto", icon: Swords, label: "Confronto" },
  { path: "backtesting", icon: FlaskConical, label: "Backtesting" },
];

export default function SubNav() {
  const { ligaAtual } = useLiga();
  if (!ligaAtual) return null;
  const base = `/${ligaAtual.espn_slug}`;

  return (
    <div className="border-b border-border/60 bg-background/60">
      <div
        className="flex gap-1 overflow-x-auto px-4 py-1.5 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {subItems.map(({ path, icon: Icon, label, end }) => {
          const to = path ? `${base}/${path}` : base;
          return (
            <NavLink
              key={path || "index"}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-bet-green/10 text-bet-green"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
