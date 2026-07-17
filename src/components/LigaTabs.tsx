import { useLiga } from "@/contexts/LigaContext";
import { cn } from "@/lib/utils";

export default function LigaTabs() {
  const { ligas, ligaAtual, changeLiga, isLoading } = useLiga();

  if (isLoading && !ligas.length) {
    return <div className="h-10 border-b border-border/60 bg-card/40" aria-hidden />;
  }

  return (
    <div className="border-b border-border/60 bg-card/40 backdrop-blur">
      <div
        className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label="Selecionar liga"
      >
        {ligas.map((liga) => {
          const active = ligaAtual?.id === liga.id;
          return (
            <button
              key={liga.id}
              role="tab"
              aria-selected={active}
              onClick={() => changeLiga(liga.espn_slug)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors",
                active
                  ? "bg-bet-green/15 text-bet-green ring-1 ring-bet-green/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              {liga.nome}
            </button>
          );
        })}
      </div>
    </div>
  );
}
