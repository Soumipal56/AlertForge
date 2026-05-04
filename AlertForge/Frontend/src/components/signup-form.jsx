import { useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  registerThunk,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
} from "@/store/slices/authSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";

export function SignupForm({ ...props }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const reduxError = useSelector(selectAuthError);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",

  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        registerThunk({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      ).unwrap();
      navigate("/dashboard");
    } catch {
      // error already in Redux via selectAuthError
    }
  };

  const handleGoogleSignup = () => {
    const apiUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:3000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleChange = (field) => (e) => {
    dispatch(clearAuthError());
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <Card
      className="bg-neutral-900 border-neutral-700 text-white shadow-xl"
      {...props}
    >
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-white">
          Create an account
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-neutral-300 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={form.name}
              onChange={handleChange("name")}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-neutral-300 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={form.email}
              onChange={handleChange("email")}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-neutral-300 font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange("password")}
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-0"
            />
            <p className="text-xs text-neutral-500">
              Must be at least 8 characters long.
            </p>
          </div>

          {/* Redux error (email taken, server error, etc.) */}
          {reduxError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-sm text-red-400">{reduxError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-neutral-200 font-semibold transition-all duration-200"
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-neutral-900 px-2 text-neutral-500">
                or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignup}
            className="w-full bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700 transition-all duration-200"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
            >
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
