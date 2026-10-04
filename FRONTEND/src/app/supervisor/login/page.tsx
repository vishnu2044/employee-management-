"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { attendanceApi } from "@/lib/api";

export default function SupervisorLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await attendanceApi.loginSupervisor({ username, password });
      // Store token securely (e.g. localStorage/cookies) in a real app
      if (result.access_token) {
        localStorage.setItem("supervisor_token", result.access_token);
        window.dispatchEvent(new Event("auth-change"));
      }
      router.push("/supervisor");
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-[var(--color-border)] w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary-dark)] text-white rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">Supervisor Access</h1>
          <p className="text-[var(--color-secondary-text)] text-sm mt-1">Please log in to manage attendance</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-3 px-4 rounded shadow-sm transition-colors mt-6 uppercase tracking-wider text-sm flex justify-center items-center"
          >
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>For demo purposes use:</p>
          <p className="font-mono mt-1">supervisor / supervisor123</p>
        </div>
      </div>
    </div>
  );
}
