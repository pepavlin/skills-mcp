"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZapIcon, LockIcon, UserIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, oklch(0.22 0.08 277) 0%, oklch(0.18 0.12 300) 50%, oklch(0.15 0.06 280) 100%)"
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.68 0.18 277), transparent)" }}
        />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.2 310), transparent)" }}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.15 260), transparent)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 277), oklch(0.55 0.25 300))" }}
            >
              <ZapIcon className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">AI Skills</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Your AI skills,<br />always within reach.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "oklch(0.78 0.04 277)" }}>
              Store, organize, and serve your AI techniques through MCP.
              Let your AI assistants discover and apply your knowledge automatically.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "MCP-native", desc: "Query skills directly from any AI assistant" },
              { label: "Organized", desc: "Tag and categorize by type and topic" },
              { label: "Always available", desc: "HTTP endpoint, zero configuration" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "oklch(0.62 0.22 277 / 0.4)" }}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{f.label}</span>
                  <span style={{ color: "oklch(0.7 0.03 277)" }} className="text-sm"> — {f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10" style={{ color: "oklch(0.5 0.02 277)" }}>
          <span className="text-xs">ai-skills.pavlin.dev</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
                style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 277), oklch(0.55 0.25 300))" }}
              >
                <ZapIcon className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight">AI Skills</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-11 pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
