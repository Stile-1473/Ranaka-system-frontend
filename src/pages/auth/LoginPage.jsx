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
      email: "requester1@ranaka.org",
      password: "Password@123",
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(35,139,100,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="p-8 lg:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="mt-6 text-center">
            <p className="section-title">Ranaka</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">
              Sign in
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
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
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password@123"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-brand-700"
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
                <span className="text-xs text-rose-600">
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
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loginError}
            </div>
          ) : null}

          <div className="mt-8 border-t border-slate-200 pt-5 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Demo Access
            </p>
            <p className="mt-3 text-sm text-slate-600">
              requester1@ranaka.org / Password@123
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default LoginPage;
