import { useState } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { updateJogo, deleteJogo } from '@/services/supabase/jogosService';
import type { JogoComTimesRaw } from '@/services/supabase/jogosService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logAudit, calcDiff } from '@/lib/audit';
import RlsErrorAlert from '@/components/RlsErrorAlert';

type Props = {
  jogo: JogoComTimesRaw;
  onSuccess: () => void;
  onClose: () => void;
};

type RlsErr = { message: string; operation: 'UPDATE' | 'DELETE' } | null;

export default function FormEditarJogo({ jogo, onSuccess, onClose }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rlsError, setRlsError] = useState<RlsErr>(null);
  const [motivo, setMotivo] = useState('');
  const [form, setForm] = useState({
    rodada: jogo.rodada,
    data_jogo: jogo.data_jogo?.slice(0, 10) ?? '',
    gols_casa: jogo.gols_casa,
    gols_fora: jogo.gols_fora,
    escanteios_casa: jogo.escanteios_casa,
    escanteios_fora: jogo.escanteios_fora,
    cartoes_total: jogo.cartoes_total,
  });

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const golsTotal = form.gols_casa + form.gols_fora;
  const escTotal = form.escanteios_casa + form.escanteios_fora;
  const resultado = form.gols_casa > form.gols_fora ? 'casa' : form.gols_fora > form.gols_casa ? 'fora' : 'empate';
  const targetLabel = `#${jogo.id} ${jogo.time_casa?.nome ?? '—'} vs ${jogo.time_fora?.nome ?? '—'}`;

  const isRlsError = (msg: string) => /RLS|row-level|0 rows|bloqueada/i.test(msg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setRlsError(null);
    const updates = {
      rodada: form.rodada,
      data_jogo: form.data_jogo,
      gols_casa: form.gols_casa,
      gols_fora: form.gols_fora,
      resultado: resultado as 'casa' | 'fora' | 'empate',
      escanteios_casa: form.escanteios_casa,
      escanteios_fora: form.escanteios_fora,
      cartoes_total: form.cartoes_total,
    };
    try {
      await updateJogo(jogo.id, updates);
      logAudit({
        action: 'editar_jogo',
        user: user?.email ?? 'desconhecido',
        target: targetLabel,
        motivo: motivo.trim() || undefined,
        diff: calcDiff(jogo as unknown as Record<string, unknown>, updates),
      });
      toast.success('Jogo atualizado com sucesso');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar jogo';
      if (isRlsError(msg)) {
        setRlsError({ message: msg, operation: 'UPDATE' });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir o jogo ${jogo.time_casa?.nome ?? ''} vs ${jogo.time_fora?.nome ?? ''}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    setRlsError(null);
    try {
      await deleteJogo(jogo.id);
      logAudit({
        action: 'excluir_jogo',
        user: user?.email ?? 'desconhecido',
        target: targetLabel,
        motivo: motivo.trim() || undefined,
      });
      toast.success('Jogo excluído com sucesso');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao excluir jogo';
      if (isRlsError(msg)) {
        setRlsError({ message: msg, operation: 'DELETE' });
      } else {
        toast.error(msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = 'w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="form-editar-jogo">
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar Jogo</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent" aria-label="Fechar"><X className="w-4 h-4" /></button>
        </div>

        <div className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
          <span className="font-medium text-foreground">{jogo.time_casa?.nome ?? '—'}</span>
          {' vs '}
          <span className="font-medium text-foreground">{jogo.time_fora?.nome ?? '—'}</span>
        </div>

        {rlsError && <RlsErrorAlert message={rlsError.message} operation={rlsError.operation} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Rodada</label>
            <input data-testid="input-rodada" type="number" min={1} max={38} value={form.rodada} onChange={e => set('rodada', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Data</label>
            <input type="date" value={form.data_jogo} onChange={e => set('data_jogo', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Gols Casa</label>
            <input data-testid="input-gols-casa" type="number" min={0} value={form.gols_casa} onChange={e => set('gols_casa', Number(e.target.value))} className={inputCls} />
          </div>
          <div className="flex items-end justify-center pb-2 text-muted-foreground text-sm font-medium">×</div>
          <div>
            <label className={labelCls}>Gols Fora</label>
            <input data-testid="input-gols-fora" type="number" min={0} value={form.gols_fora} onChange={e => set('gols_fora', Number(e.target.value))} className={inputCls} />
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
            <input data-testid="input-cartoes-total" type="number" min={0} value={form.cartoes_total} onChange={e => set('cartoes_total', Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Motivo (opcional)</label>
          <input
            data-testid="input-motivo"
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ex: corrigir placar, dado errado…"
            className={inputCls}
          />
        </div>

        <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-3 space-y-1">
          <p>Resultado: <span className="font-semibold text-foreground">{resultado}</span> · Gols: {golsTotal} · Escanteios: {escTotal}</p>
          <p>Over 5 cantos: {escTotal > 5 ? '✅' : '❌'} · Under 3.5 gols: {golsTotal < 3.5 ? '✅' : '❌'} · Under 7 cartões: {form.cartoes_total < 7 ? '✅' : '❌'}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            data-testid="btn-salvar"
            type="submit"
            disabled={saving || deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            data-testid="btn-excluir"
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </form>
    </div>
  );
}
