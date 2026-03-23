import { motion } from 'framer-motion';
import { History } from 'lucide-react';

export default function Historico() {
  return (
    <div className="page-container space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-display tracking-wide">Histórico 10 Anos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tendências de 2016 a 2026</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="card-bet p-8 flex flex-col items-center justify-center min-h-[300px]"
      >
        <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">Em construção — próxima etapa</p>
      </motion.div>
    </div>
  );
}
