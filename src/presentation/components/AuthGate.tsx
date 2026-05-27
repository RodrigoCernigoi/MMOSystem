import { LogIn, LogOut, UserPlus } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { useAuth } from "../useAuth";

type AuthGateProps = {
  children: ReactNode;
};

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, isLoading, error, isAuthEnabled, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <main className="loading">Carregando sessao...</main>;
  }

  if (!user) {
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await signIn(email, password);
    };

    return (
      <main className="auth-shell">
        <form className="auth-panel" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">MMO System</p>
            <h1>Entrar</h1>
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
          {error && <div className="error-banner">{error}</div>}
          <div className="auth-actions">
            <button type="submit" title="Entrar">
              <LogIn size={18} />
              Entrar
            </button>
            <button type="button" onClick={() => signUp(email, password)} title="Criar conta">
              <UserPlus size={18} />
              Criar conta
            </button>
          </div>
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
