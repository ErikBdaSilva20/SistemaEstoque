import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedAuthForm } from "@/components/auth/AnimatedAuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    navigate("/dashboard", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg-base)] px-4 py-6">
      <AnimatedAuthForm />
    </div>
  );
}
