import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, signupSchema } from "@/lib/validations";

export function useAuthForms() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? undefined;
  const initialTab = searchParams.get("tab");

  const [isActive, setIsActive] = useState(initialTab === "signup");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const parsed = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      });
      setLoginErrors(fieldErrors);
      return;
    }

    setLoginLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoginLoading(false);

    if (error) {
      const msg = error.toLowerCase().includes("invalid") ? "Email ou senha incorretos." : error;
      toast.error(msg);
      return;
    }

    toast.success("Login realizado!");
    navigate(redirectTo ?? "/dashboard", { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    const parsed = signupSchema.safeParse({
      fullName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      });
      setSignupErrors(fieldErrors);
      return;
    }

    setSignupLoading(true);
    const { error } = await signUp(parsed.data.fullName, parsed.data.email, parsed.data.password);
    setSignupLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Conta criada com sucesso!");
    navigate("/dashboard", { replace: true });
  };

  return {
    isActive,
    setIsActive,
    login: {
      email: loginEmail,
      setEmail: setLoginEmail,
      password: loginPassword,
      setPassword: setLoginPassword,
      errors: loginErrors,
      loading: loginLoading,
      submit: handleLogin,
    },
    signup: {
      fullName,
      setFullName,
      email: signupEmail,
      setEmail: setSignupEmail,
      password: signupPassword,
      setPassword: setSignupPassword,
      confirmPassword,
      setConfirmPassword,
      errors: signupErrors,
      loading: signupLoading,
      submit: handleSignup,
    },
  };
}
