import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Unable to sign in with those credentials.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm p-6">
        <ShieldCheck className="h-9 w-9 text-cyan" />
        <h1 className="mt-4 text-2xl font-semibold">SentinelMail AI</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enterprise phishing detection console
        </p>
        <label className="mt-6 block text-sm text-slate-300">Email</label>
        <input
          className="focus-ring mt-2 w-full rounded-md border border-line bg-ink px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="mt-4 block text-sm text-slate-300">Password</label>
        <input
          className="focus-ring mt-2 w-full rounded-md border border-line bg-ink px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button className="focus-ring mt-6 w-full rounded-md bg-cyan px-4 py-2 font-semibold text-ink">
          Sign in
        </button>
      </form>
    </main>
  );
}
