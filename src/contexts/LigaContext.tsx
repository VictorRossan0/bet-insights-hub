import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export type Liga = {
  id: number;
  nome: string;
  espn_slug: string;
  pais?: string | null;
  mostra_recomendacao_cantos?: boolean | null;
};


type LigaContextValue = {
  ligaAtual: Liga | null;
  temporadaAtualId: number | null;
  ligas: Liga[];
  isLoading: boolean;
  changeLiga: (slug: string) => void;
};

const DEFAULT_SLUG = "bra.1";

const LigaContext = createContext<LigaContextValue | undefined>(undefined);

function getSlugFromPath(pathname: string): string | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg) return null;
  // Slugs are of form "xxx.N" (bra.1, eng.1, ...). Ignore other segments like "auth", "admin".
  return /^[a-z]{2,4}\.\d+$/i.test(seg) ? seg : null;
}

export function LigaProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const slugFromUrl = getSlugFromPath(location.pathname);

  const { data: ligas = [], isLoading: loadingLigas } = useQuery({
    queryKey: ["competicoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competicoes")
        .select("id, nome, espn_slug, pais")
        .order("id", { ascending: true });
      if (error) throw error;
      return (data || []) as Liga[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const ligaAtual = useMemo<Liga | null>(() => {
    if (!ligas.length) return null;
    const bySlug = slugFromUrl && ligas.find((l) => l.espn_slug === slugFromUrl);
    if (bySlug) return bySlug;
    return ligas.find((l) => l.espn_slug === DEFAULT_SLUG) ?? ligas[0];
  }, [ligas, slugFromUrl]);

  const { data: temporadaAtualId = null, isLoading: loadingTemp } = useQuery({
    queryKey: ["temporada-atual", ligaAtual?.id],
    enabled: !!ligaAtual?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_temporada_atual" as never, {
        p_competicao_id: ligaAtual!.id,
      } as never);
      if (error) throw error;
      if (typeof data === "number") return data;
      if (Array.isArray(data) && data.length > 0) {
        const row = data[0] as Record<string, unknown>;
        const v = row.temporada_id ?? row.id ?? Object.values(row)[0];
        return typeof v === "number" ? v : null;
      }
      return null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const changeLiga = (slug: string) => {
    const segs = location.pathname.split("/").filter(Boolean);
    if (segs.length && getSlugFromPath(location.pathname)) {
      segs[0] = slug;
    } else {
      segs.unshift(slug);
    }
    navigate("/" + segs.join("/"));
  };

  // If URL has no valid slug but we're inside the app shell area, no-op (App handles redirects).
  useEffect(() => {
    // reserved for future sync side effects
  }, [ligaAtual?.espn_slug]);

  const value: LigaContextValue = {
    ligaAtual,
    temporadaAtualId,
    ligas,
    isLoading: loadingLigas || loadingTemp,
    changeLiga,
  };

  return <LigaContext.Provider value={value}>{children}</LigaContext.Provider>;
}

export function useLiga() {
  const ctx = useContext(LigaContext);
  if (!ctx) throw new Error("useLiga must be used within LigaProvider");
  return ctx;
}
