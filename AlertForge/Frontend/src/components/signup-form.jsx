import { useState } from "react";
import { useSignUp } from "@clerk/react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";

export function SignupForm({ ...props }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signUp.create({
        firstName: form.name.split(" ")[0],
        lastName: form.name.split(" ").slice(1).join(" "),
        emailAddress: form.email,
        password: form.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google sign up failed.");
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700 text-white shadow-xl" {...props}>
      <CardHeader className="text-center pt-5 pb-4">
        <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
        <CardDescription className="text-neutral-400">
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-neutral-300 font-medium">Full Name</Label>
            <Input
              id="name" type="text" placeholder="John Doe" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-neutral-300 font-medium">Email</Label>
            <Input
              id="email" type="email" placeholder="m@example.com" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
            <p className="text-xs text-neutral-500">We'll never share your email with anyone.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-neutral-300 font-medium">Password</Label>
            <Input
              id="password" type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
            <p className="text-xs text-neutral-500">Must be at least 8 characters long.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password" className="text-neutral-300 font-medium">Confirm Password</Label>
            <Input
              id="confirm-password" type="password" required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
            {loading ? "Creating..." : "Create Account"}
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
            onClick={handleGoogleSignup}
            className="w-full bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700 transition-all duration-200"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <a href="/login" className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}