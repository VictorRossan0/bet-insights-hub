import { motion } from 'framer-motion';
import { Shield, LogOut } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="page-container space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-bet-green" />
          <div>
            <h1 className="text-2xl font-display tracking-wide">Painel Admin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-sm hover:bg-accent/80 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </motion.div>

      <div className="card-bet p-6">
        <h2 className="font-semibold mb-3">Status do Acesso</h2>
        {isAdmin ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-bet-green/10 border border-bet-green/30">
            <Shield className="w-5 h-5 text-bet-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-bet-green">Você é admin ✓</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você pode adicionar, editar e importar jogos. Acesse{' '}
                <Link to="/jogos" className="text-bet-green hover:underline">/jogos</Link> para gerenciar.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Conta sem permissão de admin</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sua conta foi criada, mas ainda não tem o cargo de admin.
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Para se tornar admin, execute no banco:</p>
              <pre className="p-3 rounded-lg bg-secondary text-[11px] overflow-x-auto font-mono">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
              </pre>
              <p>Depois recarregue a página.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
