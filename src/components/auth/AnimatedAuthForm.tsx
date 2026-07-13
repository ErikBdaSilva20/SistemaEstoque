import { Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { useAuthForms } from "./useAuthForms";
import { cn } from "@/lib/utils";

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
 * Estilizado só com utilitários Tailwind (tokens semânticos do design
 * system) — sem <style> inline. Breakpoint de 850px é arbitrário
 * (`max-[850px]:`) porque é a própria largura do card, não um breakpoint
 * padrão do Tailwind.
 */

const inputBoxClass = "relative my-[18px]";

const inputClass =
  "w-full rounded-[0.625rem] border border-transparent bg-bg-surface-2 px-5 py-[13px] pr-[50px] " +
  "text-[15px] font-medium text-text-primary outline-none transition-[border-color,box-shadow] " +
  "duration-200 placeholder:font-normal placeholder:text-text-tertiary focus:border-accent-primary " +
  "focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-primary)_20%,transparent)]";

const iconClass =
  "pointer-events-none absolute right-[18px] top-1/2 -translate-y-1/2 text-text-tertiary";

const errorClass = "mt-1 pl-1 text-left text-xs text-destructive";

const primaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.625rem] bg-accent-primary " +
  "text-base font-semibold text-accent-foreground shadow-[0_4px_14px_color-mix(in_oklab,var(--accent-primary)_30%,transparent)] " +
  "transition-[background-color,transform] duration-200 hover:enabled:bg-accent-hover " +
  "active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const ghostButtonClass =
  "inline-flex h-[46px] w-40 items-center justify-center gap-2 rounded-[0.625rem] border-2 " +
  "border-text-on-dark bg-transparent text-base font-semibold text-text-on-dark transition-colors " +
  "duration-200 hover:enabled:bg-[color-mix(in_oklab,var(--text-on-dark)_10%,transparent)]";

const formTitleClass = "mb-1 text-3xl font-bold text-text-primary";

function formBoxClass(isActive: boolean, isRegister: boolean) {
  return cn(
    "absolute right-0 z-[1] flex h-full w-1/2 items-center p-10 text-center text-text-primary",
    "bg-bg-elevated [transition:right_0.6s_ease-in-out_1.2s,visibility_0s_1s]",
    "max-[850px]:bottom-0 max-[850px]:right-0 max-[850px]:h-[70%] max-[850px]:w-full max-[850px]:px-6 max-[850px]:py-8",
    isActive ? "right-1/2 max-[850px]:bottom-[30%] max-[850px]:right-0" : "",
    isRegister && !isActive && "invisible",
  );
}

function toggleBoxBeforeClass(isActive: boolean) {
  return cn(
    "before:absolute before:-left-[250%] before:top-0 before:z-[2] before:h-full before:w-[300%]",
    "before:rounded-[150px] before:bg-gradient-to-br before:from-bg-darkest before:to-accent-primary",
    "before:transition-[left] before:duration-[1800ms] before:ease-in-out before:content-['']",
    "max-[850px]:before:left-0 max-[850px]:before:top-[-270%] max-[850px]:before:h-[300%] max-[850px]:before:w-full max-[850px]:before:rounded-[20vw]",
    isActive ? "before:left-1/2 max-[850px]:before:left-0 max-[850px]:before:top-[70%]" : "",
  );
}

function togglePanelClass(isActive: boolean, side: "left" | "right") {
  const base =
    "absolute z-[2] flex h-full w-1/2 flex-col items-center justify-center p-10 text-center " +
    "text-text-on-dark transition-all duration-[600ms] ease-in-out " +
    "max-[850px]:h-[30%] max-[850px]:w-full max-[850px]:p-5";

  if (side === "left") {
    return cn(
      base,
      "left-0 delay-[1200ms] max-[850px]:left-0 max-[850px]:top-0",
      isActive ? "-left-1/2 delay-[600ms] max-[850px]:left-0 max-[850px]:-top-[30%]" : "",
    );
  }
  return cn(
    base,
    "-right-1/2 delay-[600ms] max-[850px]:bottom-[-30%] max-[850px]:right-0",
    isActive ? "right-0 delay-[1200ms] max-[850px]:bottom-0 max-[850px]:right-0" : "",
  );
}

export function AnimatedAuthForm() {
  const { isActive, setIsActive, login, signup } = useAuthForms();

  return (
    <div
      className={cn(
        "relative h-[600px] w-[850px] max-w-full overflow-hidden rounded-3xl bg-bg-elevated",
        "shadow-[0_25px_60px_-15px_color-mix(in_oklab,var(--bg-darkest)_35%,transparent)]",
        "max-[850px]:h-[calc(100vh-40px)] max-[850px]:min-h-[640px] max-[850px]:w-full max-[850px]:rounded-[1.25rem]",
      )}
    >
      {/* LOGIN FORM */}
      <div className={formBoxClass(isActive, false)}>
        <form onSubmit={login.submit} className="w-full">
          <h1 className={formTitleClass}>Entrar</h1>
          <p className="mb-2 text-sm text-text-secondary">Acesse sua conta</p>

          <div className={inputBoxClass}>
            <input
              type="email"
              placeholder="Email"
              value={login.email}
              onChange={(e) => login.setEmail(e.target.value)}
              disabled={login.loading}
              autoComplete="email"
              className={inputClass}
            />
            <Mail size={18} className={iconClass} />
            {login.errors.email && <p className={errorClass}>{login.errors.email}</p>}
          </div>

          <div className={inputBoxClass}>
            <input
              type="password"
              placeholder="Senha"
              value={login.password}
              onChange={(e) => login.setPassword(e.target.value)}
              disabled={login.loading}
              autoComplete="current-password"
              className={inputClass}
            />
            <Lock size={18} className={iconClass} />
            {login.errors.password && <p className={errorClass}>{login.errors.password}</p>}
          </div>

          <button type="submit" className={primaryButtonClass} disabled={login.loading}>
            {login.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>
        </form>
      </div>

      {/* SIGNUP FORM */}
      <div className={formBoxClass(isActive, true)}>
        <form onSubmit={signup.submit} className="w-full">
          <h1 className={formTitleClass}>Criar conta</h1>
          <p className="mb-2 text-sm text-text-secondary">Cadastre-se para começar</p>

          <div className={inputBoxClass}>
            <input
              type="text"
              placeholder="Nome completo"
              value={signup.fullName}
              onChange={(e) => signup.setFullName(e.target.value)}
              disabled={signup.loading}
              autoComplete="name"
              className={inputClass}
            />
            <UserIcon size={18} className={iconClass} />
            {signup.errors.fullName && <p className={errorClass}>{signup.errors.fullName}</p>}
          </div>

          <div className={inputBoxClass}>
            <input
              type="email"
              placeholder="Email"
              value={signup.email}
              onChange={(e) => signup.setEmail(e.target.value)}
              disabled={signup.loading}
              autoComplete="email"
              className={inputClass}
            />
            <Mail size={18} className={iconClass} />
            {signup.errors.email && <p className={errorClass}>{signup.errors.email}</p>}
          </div>

          <div className={inputBoxClass}>
            <input
              type="password"
              placeholder="Senha (mín. 6 caracteres)"
              value={signup.password}
              onChange={(e) => signup.setPassword(e.target.value)}
              disabled={signup.loading}
              autoComplete="new-password"
              className={inputClass}
            />
            <Lock size={18} className={iconClass} />
            {signup.errors.password && <p className={errorClass}>{signup.errors.password}</p>}
          </div>

          <div className={inputBoxClass}>
            <input
              type="password"
              placeholder="Confirmar senha"
              value={signup.confirmPassword}
              onChange={(e) => signup.setConfirmPassword(e.target.value)}
              disabled={signup.loading}
              autoComplete="new-password"
              className={inputClass}
            />
            <Lock size={18} className={iconClass} />
            {signup.errors.confirmPassword && (
              <p className={errorClass}>{signup.errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className={primaryButtonClass} disabled={signup.loading}>
            {signup.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Cadastrar
          </button>
        </form>
      </div>

      {/* TOGGLE BOX */}
      <div className={cn("absolute h-full w-full", toggleBoxBeforeClass(isActive))}>
        <div className={togglePanelClass(isActive, "left")}>
          <h1 className="mb-2 text-[32px] font-bold max-[850px]:text-2xl">Olá, bem-vindo!</h1>
          <p className="mb-6 text-[14.5px] text-text-on-dark-muted">Ainda não tem uma conta?</p>
          <button type="button" className={ghostButtonClass} onClick={() => setIsActive(true)}>
            Cadastrar
          </button>
        </div>

        <div className={togglePanelClass(isActive, "right")}>
          <h1 className="mb-2 text-[32px] font-bold max-[850px]:text-2xl">Bem-vindo de volta!</h1>
          <p className="mb-6 text-[14.5px] text-text-on-dark-muted">Já possui uma conta?</p>
          <button type="button" className={ghostButtonClass} onClick={() => setIsActive(false)}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
