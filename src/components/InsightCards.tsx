import { motion } from 'framer-motion';
import type { SugestaoAposta } from '@/types/database';
import { Check, X, Send } from 'lucide-react';

type Props = {
  sugestoes: SugestaoAposta[];
  isLoading: boolean;
  onMarkResult: (id: number, resultado: 'ganhou' | 'perdeu') => void;
  onSendTelegram: (sugestao: SugestaoAposta) => void;
};

function calcValorEV(confianca: number, odd: number): number {
  return (confianca / 100) * odd - 1;
}

export default function InsightCards({ sugestoes, isLoading, onMarkResult, onSendTelegram }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-bet p-5 space-y-3">
            <div className="h-5 w-32 bg-secondary rounded animate-pulse" />
            <div className="h-3 w-full bg-secondary rounded animate-pulse" />
            <div className="h-2 w-48 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (sugestoes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-1">Sem sugestões ainda</p>
        <p className="text-sm">Clique em "Gerar Análise" para criar sugestões com IA.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sugestoes.map((s, i) => {
        const ev = calcValorEV(s.confianca, s.odd_sugerida);
        const isPositiveEV = ev > 0;

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card-bet p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-base">{s.mercado}</h3>
                <span className="text-xs text-muted-foreground">{s.tipo_aposta}</span>
              </div>
              <span className={isPositiveEV ? 'badge-green' : 'badge-red'}>
                {isPositiveEV ? '+' : ''}EV {ev.toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.descricao}</p>

            {/* Confidence bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Confiança</span>
                <span className="font-mono font-semibold text-bet-green">{s.confianca}%</span>
              </div>
              <div className="market-bar">
                <motion.div
                  className="market-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.confianca}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Odd:</span>
                <span className="font-mono font-bold text-sm">{s.odd_sugerida}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {s.resultado === 'pendente' || !s.resultado ? (
                  <>
                    <button
                      onClick={() => onMarkResult(s.id, 'ganhou')}
                      className="p-1.5 rounded-md bg-bet-green/10 text-bet-green hover:bg-bet-green/20 transition-colors active:scale-95"
                      title="Ganhou"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMarkResult(s.id, 'perdeu')}
                      className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors active:scale-95"
                      title="Perdeu"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className={s.resultado === 'ganhou' ? 'badge-green' : 'badge-red'}>
                    {s.resultado === 'ganhou' ? '✅ Ganhou' : '❌ Perdeu'}
                  </span>
                )}
                <button
                  onClick={() => onSendTelegram(s)}
                  className="p-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors active:scale-95"
                  title="Enviar Telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
