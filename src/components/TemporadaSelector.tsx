import { useLiga } from "@/contexts/LigaContext";

type Props = {
  className?: string;
};

export default function TemporadaSelector({ className }: Props) {
  const { temporadas, temporadaSelecionadaId, setTemporadaSelecionada } = useLiga();

  if (!temporadas.length) return null;

  return (
    <select
      value={temporadaSelecionadaId ?? ""}
      onChange={(e) => setTemporadaSelecionada(Number(e.target.value))}
      aria-label="Selecionar temporada"
      className={
        "bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring " +
        (className ?? "")
      }
    >
      {temporadas.map((t) => (
        <option key={t.id} value={t.id}>
          {t.ano}
        </option>
      ))}
    </select>
  );
}
