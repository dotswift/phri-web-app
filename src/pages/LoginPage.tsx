import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrustBadges } from "@/components/shared/TrustBadges";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Check, Eye, EyeOff } from "lucide-react";

function getPasswordStrength(pw: string): "weak" | "fair" | "strong" {
  if (pw.length < 8) return "weak";
  let criteria = 0;
  if (/[A-Z]/.test(pw)) criteria++;
  if (/[a-z]/.test(pw)) criteria++;
  if (/[0-9]/.test(pw)) criteria++;
  if (/[^A-Za-z0-9]/.test(pw)) criteria++;
  if (criteria === 4) return "strong";
  if (criteria >= 2) return "fair";
  return "weak";
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (isSignUp) {
      if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
      ) {
        newErrors.password = "Password must meet all requirements below";
      }
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Account created! You may need to verify your email.");
      } else {
        await signIn(email, password);
      }
      navigate("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold leading-none tracking-tight">
            <span className="text-primary">P</span>HRI
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create your account" : "Personal Health Record & Insights"}
          </p>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading || loading}
            onClick={async () => {
              setGoogleLoading(true);
              try {
                await signInWithGoogle();
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Google sign-in failed",
                );
                setGoogleLoading(false);
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.password}
                </p>
              )}
              {isSignUp && (() => {
                const strength = getPasswordStrength(password);
                const color = { weak: "bg-red-500", fair: "bg-yellow-500", strong: "bg-green-500" }[strength];
                const segments = { weak: 1, fair: 2, strong: 3 }[strength];
                const show = password.length > 0;
                return (
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: show ? "1fr" : "0fr", opacity: show ? 1 : 0 }}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1 pt-0.5">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < segments ? color : "bg-muted"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize transition-all duration-300">{strength}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {isSignUp && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {[
                    { met: password.length >= 8, label: "At least 8 characters" },
                    { met: /[A-Z]/.test(password), label: "Uppercase letter" },
                    { met: /[a-z]/.test(password), label: "Lowercase letter" },
                    { met: /[0-9]/.test(password), label: "Number" },
                    { met: /[^A-Za-z0-9]/.test(password), label: "Special character" },
                  ].map((req) => (
                    <li key={req.label} className="flex items-center gap-1.5">
                      {req.met ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <span className="inline-block h-3 w-3 text-center leading-3">·</span>
                      )}
                      {req.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  placeholder="Re-enter your password"
                  aria-required="true"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                />
                {errors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setConfirmPassword("");
                setErrors({});
              }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
          <div className="mt-4 border-t pt-4">
            <TrustBadges />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
