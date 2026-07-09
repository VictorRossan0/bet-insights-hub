import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  message: string;
  operation: 'UPDATE' | 'DELETE' | 'INSERT';
};

export default function RlsErrorAlert({ message, operation }: Props) {
  const { isAdmin } = useAuth();

  return (
    <div
      data-testid="rls-error-alert"
      role="alert"
      className="border border-destructive/40 bg-destructive/10 rounded-lg p-3 space-y-2 text-xs"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-destructive">Operação bloqueada pelas permissões do banco</p>
          {isAdmin ? (
            <>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-muted-foreground">
                Verifique se a política de {operation} da tabela <span className="font-mono">jogos</span>
                {' '}exige o papel <span className="font-mono">admin</span> e se o seu usuário tem esse papel atribuído.
                Consulte a documentação interna para o SQL de configuração.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Você não tem permissão para executar esta ação. Entre em contato com um administrador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
