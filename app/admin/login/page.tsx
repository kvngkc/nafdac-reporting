import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Staff sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-xl font-bold">Staff dashboard</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Authorised reviewers only</p>
        <LoginForm />
      </div>
    </div>
  );
}
