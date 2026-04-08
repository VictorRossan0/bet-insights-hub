/**
 * Intelligent Empty State component with contextual messaging and actions.
 */
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, secondaryAction, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`card-bet p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[280px] ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors active:scale-[0.97]"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
