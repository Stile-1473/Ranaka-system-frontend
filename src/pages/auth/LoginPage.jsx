import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import InputField from "../../components/forms/InputField";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultRouteForRole } from "../../config/permissions";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, loginError, currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // If the user is already authenticated, skip the login form completely.
    if (currentUser?.role) {
      navigate(getDefaultRouteForRole(currentUser.role), { replace: true });
    }
  }, [currentUser, navigate]);

  const onSubmit = async (values) => {
    try {
      const result = await login(values);
      const role = result?.user?.role || result?.authResponse?.role;
      // Short positive toast keeps login feedback snappy and friendly.
      toast.success("Welcome back", {
        description: "Your workspace is ready.",
      });
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch {
      toast.error("Sign in failed", {
        description: loginError || "Please check your credentials and try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-950 px-6 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.94),rgba(2,6,23,0.74)_38%,rgba(2,6,23,0.9)),var(--app-background-image)] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,197,94,0.22),transparent_28%),radial-gradient(circle_at_84%_78%,rgba(22,163,74,0.16),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="p-8 lg:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="mt-6 text-center">
            <p className="section-title">Ranaka</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-50">
              Sign in
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Access the procurement workflow system with your work account.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Form fields use react-hook-form registration directly */}
            <InputField
              label="Email"
              type="email"
              placeholder="requester1@ranaka.org"
              error={errors.email?.message}
              {...register("email")}
            />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-200">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ranaka@123"
                  className="w-full rounded-[1.05rem] border border-white/10 bg-white/6 px-4 py-3 pr-12 text-sm text-slate-50 shadow-[0_16px_40px_-30px_rgba(2,6,23,1)] outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/8 focus:ring-4 focus:ring-emerald-500/10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-emerald-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password?.message ? (
                <span className="text-xs text-rose-300">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            <Button
              type="submit"
              className="w-full justify-center py-3"
              disabled={loginStatus === "loading"}
            >
              {loginStatus === "loading" ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Inline backend or auth-layer error feedback */}
          {loginError ? (
            <div className="mt-4 rounded-[1.05rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {loginError}
            </div>
          ) : null}
        </Card>
      </motion.div>
    </div>
  );
}

export default LoginPage;
