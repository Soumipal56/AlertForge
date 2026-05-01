import { useState } from "react";
import { useSignIn } from "@clerk/react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";

export function LoginForm({ ...props }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: form.email,
        password: form.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google sign in failed.");
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700 text-white shadow-xl" {...props}>
      <CardHeader className="text-center pt-5 pb-4 px-8">
        <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
        <CardDescription className="text-neutral-400">
          Enter your credentials to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-neutral-300 font-medium">Email</Label>
            <Input
              id="email" type="email" placeholder="m@example.com" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-neutral-300 font-medium">Password</Label>
              <a href="/forgot-password" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Forgot password?
              </a>
            </div>
            <Input
              id="password" type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit" disabled={loading}
            className="w-full bg-white text-black hover:bg-neutral-200 font-semibold transition-all duration-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-neutral-900 px-2 text-neutral-500">or continue with</span>
            </div>
          </div>

          <Button
            variant="outline" type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700 transition-all duration-200"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Don't have an account?{" "}
            <a href="/register" className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}