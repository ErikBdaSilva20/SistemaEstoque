import { Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { useAuthForms } from "./useAuthForms";

/**
 * AnimatedAuthForm
 *
 * Login/Signup com animação de painel deslizante.
 * Mantém TODA a lógica de auth original:
 *  - Validação Zod (loginSchema / signupSchema)
 *  - signIn / signUp do useAuth
 *  - Redirecionamentos (/dashboard, /pending-approval, ?redirect=)
 *  - Toasts de erro/sucesso
 *
 * Estilizado com tokens semânticos do design system Viver de IA.
 */
export function AnimatedAuthForm() {
  const { isActive, setIsActive, login, signup } = useAuthForms();

  return (
    <>
      <style>{`
        .auth-anim-container {
          position: relative;
          width: 850px;
          max-width: 100%;
          height: 600px;
          background: var(--bg-elevated);
          border-radius: 1.5rem;
          box-shadow: 0 25px 60px -15px color-mix(in oklab, var(--bg-darkest) 35%, transparent);
          overflow: hidden;
        }

        .auth-form-box {
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          color: var(--text-primary);
          text-align: center;
          padding: 40px;
          z-index: 1;
          transition: 0.6s ease-in-out 1.2s, visibility 0s 1s;
        }

        .auth-anim-container.active .auth-form-box {
          right: 50%;
        }

        .auth-form-box.register {
          visibility: hidden;
        }

        .auth-anim-container.active .auth-form-box.register {
          visibility: visible;
        }

        .auth-input-box {
          position: relative;
          margin: 18px 0;
        }

        .auth-input-box input {
          width: 100%;
          padding: 13px 50px 13px 20px;
          background: var(--bg-surface-2);
          border-radius: 0.625rem;
          border: 1px solid transparent;
          outline: none;
          font-size: 15px;
          color: var(--text-primary);
          font-weight: 500;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .auth-input-box input::placeholder {
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .auth-input-box input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent-primary) 20%, transparent);
        }

        .auth-input-box .auth-icon {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .auth-error {
          color: var(--destructive);
          font-size: 12px;
          text-align: left;
          margin-top: 4px;
          padding-left: 4px;
        }

        .auth-btn {
          width: 100%;
          height: 48px;
          background: var(--accent-primary);
          border-radius: 0.625rem;
          box-shadow: 0 4px 14px color-mix(in oklab, var(--accent-primary) 30%, transparent);
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: var(--accent-foreground);
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.1s;
        }

        .auth-btn:hover:not(:disabled) {
          background: var(--accent-primary-hover);
        }

        .auth-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-toggle-box {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .auth-toggle-box::before {
          content: '';
          position: absolute;
          left: -250%;
          width: 300%;
          height: 100%;
          background: linear-gradient(135deg, var(--bg-darkest), var(--accent-primary));
          border-radius: 150px;
          z-index: 2;
          transition: 1.8s ease-in-out;
        }

        .auth-anim-container.active .auth-toggle-box::before {
          left: 50%;
        }

        .auth-toggle-panel {
          position: absolute;
          width: 50%;
          height: 100%;
          color: var(--text-on-dark);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          text-align: center;
          z-index: 2;
          transition: 0.6s ease-in-out;
        }

        .auth-toggle-panel h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .auth-toggle-panel p {
          margin-bottom: 24px;
          font-size: 14.5px;
          color: var(--text-on-dark-muted);
        }

        .auth-toggle-panel.toggle-left {
          left: 0;
          transition-delay: 1.2s;
        }

        .auth-anim-container.active .auth-toggle-panel.toggle-left {
          left: -50%;
          transition-delay: 0.6s;
        }

        .auth-toggle-panel.toggle-right {
          right: -50%;
          transition-delay: 0.6s;
        }

        .auth-anim-container.active .auth-toggle-panel.toggle-right {
          right: 0;
          transition-delay: 1.2s;
        }

        .auth-toggle-panel .auth-btn {
          width: 160px;
          height: 46px;
          background: transparent;
          border: 2px solid var(--text-on-dark);
          box-shadow: none;
          color: var(--text-on-dark);
        }

        .auth-toggle-panel .auth-btn:hover:not(:disabled) {
          background: color-mix(in oklab, var(--text-on-dark) 10%, transparent);
        }

        .auth-form-title {
          font-size: 30px;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text-primary);
        }

        @media screen and (max-width: 850px) {
          .auth-anim-container {
            width: 100%;
            height: calc(100vh - 40px);
            min-height: 640px;
            border-radius: 1.25rem;
          }

          .auth-form-box {
            bottom: 0;
            width: 100%;
            height: 70%;
            right: 0;
            padding: 32px 24px;
          }

          .auth-anim-container.active .auth-form-box {
            right: 0;
            bottom: 30%;
          }

          .auth-toggle-box::before {
            left: 0;
            top: -270%;
            width: 100%;
            height: 300%;
            border-radius: 20vw;
          }

          .auth-anim-container.active .auth-toggle-box::before {
            left: 0;
            top: 70%;
          }

          .auth-toggle-panel {
            width: 100%;
            height: 30%;
            padding: 20px;
          }

          .auth-toggle-panel h1 {
            font-size: 24px;
          }

          .auth-toggle-panel.toggle-left {
            top: 0;
            left: 0;
          }

          .auth-anim-container.active .auth-toggle-panel.toggle-left {
            left: 0;
            top: -30%;
          }

          .auth-toggle-panel.toggle-right {
            right: 0;
            bottom: -30%;
          }

          .auth-anim-container.active .auth-toggle-panel.toggle-right {
            bottom: 0;
            right: 0;
          }
        }
      `}</style>

      <div className={`auth-anim-container ${isActive ? "active" : ""}`}>
        {/* LOGIN FORM */}
        <div className="auth-form-box login">
          <form onSubmit={login.submit} className="form-container w-full">
            <h1 className="auth-form-title">Entrar</h1>
            <p className="text-sm text-[color:var(--text-secondary)] mb-2">Acesse sua conta</p>

            <div className="auth-input-box">
              <input
                type="email"
                placeholder="Email"
                value={login.email}
                onChange={(e) => login.setEmail(e.target.value)}
                disabled={login.loading}
                autoComplete="email"
              />
              <Mail size={18} className="auth-icon" />
              {login.errors.email && <p className="auth-error">{login.errors.email}</p>}
            </div>

            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Senha"
                value={login.password}
                onChange={(e) => login.setPassword(e.target.value)}
                disabled={login.loading}
                autoComplete="current-password"
              />
              <Lock size={18} className="auth-icon" />
              {login.errors.password && <p className="auth-error">{login.errors.password}</p>}
            </div>

            <button type="submit" className="auth-btn" disabled={login.loading}>
              {login.loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>
        </div>

        {/* SIGNUP FORM */}
        <div className="auth-form-box register">
          <form onSubmit={signup.submit} className="form-container w-full">
            <h1 className="auth-form-title">Criar conta</h1>
            <p className="text-sm text-[color:var(--text-secondary)] mb-2">
              Cadastre-se para começar
            </p>

            <div className="auth-input-box">
              <input
                type="text"
                placeholder="Nome completo"
                value={signup.fullName}
                onChange={(e) => signup.setFullName(e.target.value)}
                disabled={signup.loading}
                autoComplete="name"
              />
              <UserIcon size={18} className="auth-icon" />
              {signup.errors.fullName && <p className="auth-error">{signup.errors.fullName}</p>}
            </div>

            <div className="auth-input-box">
              <input
                type="email"
                placeholder="Email"
                value={signup.email}
                onChange={(e) => signup.setEmail(e.target.value)}
                disabled={signup.loading}
                autoComplete="email"
              />
              <Mail size={18} className="auth-icon" />
              {signup.errors.email && <p className="auth-error">{signup.errors.email}</p>}
            </div>

            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={signup.password}
                onChange={(e) => signup.setPassword(e.target.value)}
                disabled={signup.loading}
                autoComplete="new-password"
              />
              <Lock size={18} className="auth-icon" />
              {signup.errors.password && <p className="auth-error">{signup.errors.password}</p>}
            </div>

            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Confirmar senha"
                value={signup.confirmPassword}
                onChange={(e) => signup.setConfirmPassword(e.target.value)}
                disabled={signup.loading}
                autoComplete="new-password"
              />
              <Lock size={18} className="auth-icon" />
              {signup.errors.confirmPassword && (
                <p className="auth-error">{signup.errors.confirmPassword}</p>
              )}
            </div>

            <button type="submit" className="auth-btn" disabled={signup.loading}>
              {signup.loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </button>
          </form>
        </div>

        {/* TOGGLE BOX */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel toggle-left">
            <h1>Olá, bem-vindo!</h1>
            <p>Ainda não tem uma conta?</p>
            <button type="button" className="auth-btn" onClick={() => setIsActive(true)}>
              Cadastrar
            </button>
          </div>

          <div className="auth-toggle-panel toggle-right">
            <h1>Bem-vindo de volta!</h1>
            <p>Já possui uma conta?</p>
            <button type="button" className="auth-btn" onClick={() => setIsActive(false)}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
