import { CheckCircle2, Database, LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { useAuth } from "../useAuth";

type AuthGateProps = {
  children: ReactNode;
};

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, isLoading, error, isAuthEnabled, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <main className="loading">Carregando sessao...</main>;
  }

  if (!user) {
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setAuthMessage(null);
      const result = await signIn(email, password);
      if (!result.ok && result.error?.includes("Email not confirmed")) {
        setAuthMessage("Confirme o email enviado pelo Supabase antes de entrar.");
      }
      setIsSubmitting(false);
    };

    const handleSignUp = async () => {
      setIsSubmitting(true);
      setAuthMessage(null);
      const result = await signUp(email, password);
      if (result.ok) {
        setAuthMessage("Conta criada. Se a confirmacao de email estiver ativa, confirme sua caixa de entrada.");
      }
      setIsSubmitting(false);
    };

    return (
      <main className="auth-shell">
        <section className="auth-intro" aria-label="Resumo do MMO System">
          <p className="eyebrow">MMO System</p>
          <h1>Transforme rotina em progresso rastreavel</h1>
          <p>
            Missoes reais, foco, skills, recompensas e relatorios diarios sincronizados entre seus dispositivos.
          </p>
          <div className="auth-feature-grid">
            <span>
              <ShieldCheck size={16} />
              Dados por usuario
            </span>
            <span>
              <Database size={16} />
              Sync Supabase
            </span>
            <span>
              <CheckCircle2 size={16} />
              Backup JSON
            </span>
          </div>
        </section>
        <form className="auth-panel" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Acesso</p>
            <h1>Entrar</h1>
            <span>Use email e senha. Para novos testes, crie uma conta e siga o onboarding inicial.</span>
          </div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email"
            aria-label="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="senha"
            aria-label="Senha"
            minLength={6}
            required
          />
          {authMessage && <div className="success-banner">{authMessage}</div>}
          {error && <div className="error-banner">{error}</div>}
          <div className="auth-actions">
            <button type="submit" title="Entrar" disabled={isSubmitting}>
              <LogIn size={18} />
              {isSubmitting ? "Aguarde..." : "Entrar"}
            </button>
            <button type="button" onClick={handleSignUp} title="Criar conta" disabled={isSubmitting}>
              <UserPlus size={18} />
              Criar conta
            </button>
          </div>
          <small className="auth-help">Senha minima de 6 caracteres. A confirmacao por email depende da configuracao do Supabase.</small>
        </form>
      </main>
    );
  }

  return (
    <>
      <button className="sign-out-button" type="button" onClick={signOut} title="Sair">
        <LogOut size={16} />
        Sair
      </button>
      {children}
    </>
  );
};
