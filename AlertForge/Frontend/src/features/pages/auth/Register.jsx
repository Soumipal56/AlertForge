// pages/register.jsx
import { SignupForm } from "@/components/signup-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-zinc-950 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}