import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { updateJogo } from '@/services/supabase/jogosService';
import type { JogoComTimesRaw } from '@/services/supabase/jogosService';
import { toast } from 'sonner';

type Props = {
  jogo: JogoComTimesRaw;
  onSuccess: () => void;
  onClose: () => void;
};

export default function FormEditarJogo({ jogo, onSuccess, onClose }: Props) {
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateJogo(jogo.id, {
        rodada: form.rodada,
        data_jogo: form.data_jogo,
        gols_casa: form.gols_casa,
        gols_fora: form.gols_fora,
        // gols_total, escanteios_total e flags (o5/o6/o7/o8/o9_cantos, u35/u25_gols, u7_cartoes)
        // são colunas GERADAS no banco — não enviar
        resultado: resultado as 'casa' | 'fora' | 'empate',
        escanteios_casa: form.escanteios_casa,
        escanteios_fora: form.escanteios_fora,
        cartoes_total: form.cartoes_total,
      });
      toast.success('Jogo atualizado com sucesso');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar jogo');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar Jogo</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>

        <div className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
          <span className="font-medium text-foreground">{jogo.time_casa?.nome ?? '—'}</span>
          {' vs '}
          <span className="font-medium text-foreground">{jogo.time_fora?.nome ?? '—'}</span>
        </div>

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
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}