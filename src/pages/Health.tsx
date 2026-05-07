import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

type Status = "pending" | "ok" | "fail";
interface Check {
  name: string;
  path: string;
  status: Status;
  ms?: number;
  detail?: string;
}

const ROUTES: Omit<Check, "status">[] = [
  { name: "Dashboard", path: "/" },
  { name: "Jogos", path: "/jogos" },
  { name: "Times", path: "/times" },
  { name: "Apostas", path: "/apostas" },
  { name: "Confronto", path: "/confronto" },
  { name: "Histórico", path: "/historico" },
];

async function ping(path: string): Promise<{ ok: boolean; ms: number; detail: string }> {
  const start = performance.now();
  try {
    const res = await fetch(path, { method: "GET", cache: "no-store" });
    const ms = Math.round(performance.now() - start);
    return { ok: res.ok, ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - start), detail: e instanceof Error ? e.message : "erro" };
  }
}

export default function Health() {
  const [checks, setChecks] = useState<Check[]>(ROUTES.map((r) => ({ ...r, status: "pending" })));
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setChecks(ROUTES.map((r) => ({ ...r, status: "pending" })));
    const results = await Promise.all(
      ROUTES.map(async (r) => {
        const { ok, ms, detail } = await ping(r.path);
        return { ...r, status: ok ? "ok" : "fail", ms, detail } as Check;
      })
    );
    setChecks(results);
    setRunning(false);
  };

  useEffect(() => { run(); }, []);

  const allOk = checks.every((c) => c.status === "ok");
  const anyFail = checks.some((c) => c.status === "fail");

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display tracking-wide">Health Check</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validação das rotas principais da aplicação.
            </p>
          </div>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm hover:bg-accent/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} /> Reexecutar
          </button>
        </header>

        <div
          className={`rounded-lg border p-4 text-sm ${
            running ? "border-border" : allOk ? "border-green-500/50 bg-green-500/5" : anyFail ? "border-red-500/50 bg-red-500/5" : "border-border"
          }`}
          data-testid="health-summary"
          data-status={running ? "running" : allOk ? "ok" : "fail"}
        >
          {running && "⏳ Executando checks..."}
          {!running && allOk && "✅ Todos os endpoints responderam OK."}
          {!running && anyFail && "❌ Um ou mais endpoints falharam — veja detalhes abaixo."}
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {checks.map((c) => (
            <li key={c.path} className="flex items-center justify-between p-4 bg-card" data-testid={`health-row-${c.name.toLowerCase()}`}>
              <div className="flex items-center gap-3">
                {c.status === "pending" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {c.status === "ok" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {c.status === "fail" && <XCircle className="w-5 h-5 text-red-500" />}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <Link to={c.path} className="text-xs text-muted-foreground hover:underline">{c.path}</Link>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {c.detail && <div>{c.detail}</div>}
                {c.ms != null && <div>{c.ms} ms</div>}
              </div>
            </li>
          ))}
        </ul>

        <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-auto" data-testid="health-json">
{JSON.stringify(
  { status: running ? "running" : allOk ? "ok" : "degraded", checks: checks.map(({ name, path, status, ms, detail }) => ({ name, path, status, ms, detail })) },
  null,
  2
)}
        </pre>
      </div>
    </div>
  );
}
