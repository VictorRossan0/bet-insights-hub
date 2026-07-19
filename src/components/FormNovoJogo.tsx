import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Loader2 } from 'lucide-react';
import { createJogo } from '@/services/api/games.api';
import { fetchTimes } from '@/services/api/teams.api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logAudit } from '@/lib/audit';
import RlsErrorAlert from '@/components/RlsErrorAlert';
import { extractErrorMessage, isRlsError } from '@/lib/errors';

type Props = {
  temporadaId: number;
  onSuccess: () => void;
  onClose: () => void;
};

export default function FormNovoJogo({ temporadaId, onSuccess, onClose }: Props) {
  const { user } = useAuth();
  const { data: times = [] } = useQuery({ queryKey: ['times'], queryFn: () => fetchTimes() });

  const [saving, setSaving] = useState(false);
  const [rlsError, setRlsError] = useState<string | null>(null);
  const [form, setForm] = useState({
    rodada: 1,
    data_jogo: new Date().toISOString().slice(0, 10),
    time_casa_id: '',
    time_fora_id: '',
    gols_casa: 0,
    gols_fora: 0,
    escanteios_casa: 0,
    escanteios_fora: 0,
    cartoes_total: 0,
  });

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const golsTotal = form.gols_casa + form.gols_fora;
  const escTotal = form.escanteios_casa + form.escanteios_fora;
  const resultado = form.gols_casa > form.gols_fora ? 'casa' : form.gols_fora > form.gols_casa ? 'fora' : 'empate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.time_casa_id || !form.time_fora_id) {
      toast.error('Selecione os dois times');
      return;
    }
    if (form.time_casa_id === form.time_fora_id) {
      toast.error('Os times devem ser diferentes');
      return;
    }

    setSaving(true);
    setRlsError(null);
    try {
      const created = await createJogo({
        temporada_id: temporadaId,
        rodada: form.rodada,
        data_jogo: form.data_jogo,
        time_casa_id: Number(form.time_casa_id),
        time_fora_id: Number(form.time_fora_id),
        gols_casa: form.gols_casa,
        gols_fora: form.gols_fora,
        // gols_total, escanteios_total e flags são GENERATED — não enviar
        resultado: resultado as 'casa' | 'fora' | 'empate',
        escanteios_casa: form.escanteios_casa,
        escanteios_fora: form.escanteios_fora,
        cartoes_total: form.cartoes_total,
      });
      const casa = times.find(t => t.id === Number(form.time_casa_id))?.nome ?? '?';
      const fora = times.find(t => t.id === Number(form.time_fora_id))?.nome ?? '?';
      logAudit({
        action: 'criar_jogo',
        user: user?.email ?? 'desconhecido',
        target: `#${created?.id ?? 'novo'} ${casa} vs ${fora}`,
      });
      toast.success('Jogo adicionado com sucesso');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = extractErrorMessage(err, 'Erro ao adicionar jogo');
      if (isRlsError(err)) {
        setRlsError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="form-novo-jogo">
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo Jogo</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent" aria-label="Fechar"><X className="w-4 h-4" /></button>
        </div>

        {rlsError && <RlsErrorAlert message={rlsError} operation="INSERT" />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Rodada</label>
            <input type="number" min={1} max={38} value={form.rodada} onChange={e => set('rodada', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Data</label>
            <input type="date" value={form.data_jogo} onChange={e => set('data_jogo', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Time Casa</label>
            <select value={form.time_casa_id} onChange={e => set('time_casa_id', e.target.value)} className={inputCls}>
              <option value="">Selecione...</option>
              {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Time Fora</label>
            <select value={form.time_fora_id} onChange={e => set('time_fora_id', e.target.value)} className={inputCls}>
              <option value="">Selecione...</option>
              {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Gols Casa</label>
            <input type="number" min={0} value={form.gols_casa} onChange={e => set('gols_casa', Number(e.target.value))} className={inputCls} />
          </div>
          <div className="flex items-end justify-center pb-2 text-muted-foreground text-sm font-medium">×</div>
          <div>
            <label className={labelCls}>Gols Fora</label>
            <input type="number" min={0} value={form.gols_fora} onChange={e => set('gols_fora', Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Escanteios Casa</label>
            <input type="number" min={0} value={form.escanteios_casa} onChange={e => set('escanteios_casa', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Escanteios Fora</label>
            <input type="number" min={0} value={form.escanteios_fora} onChange={e => set('escanteios_fora', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cartões Total</label>
            <input type="number" min={0} value={form.cartoes_total} onChange={e => set('cartoes_total', Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-3 space-y-1">
          <p>Resultado: <span className="font-semibold text-foreground">{resultado}</span> · Gols: {golsTotal} · Escanteios: {escTotal}</p>
          <p>Over 5 cantos: {escTotal > 5 ? '✅' : '❌'} · Under 3.5 gols: {golsTotal < 3.5 ? '✅' : '❌'} · Under 7 cartões: {form.cartoes_total < 7 ? '✅' : '❌'}</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Adicionar Jogo'}
        </button>
      </form>
    </div>
  );
}
