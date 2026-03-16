"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/skills", label: "Skills", exact: false },
  { href: "/dashboard/tags", label: "Tags", exact: false },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => {
        if (!res.ok) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[3.75rem] max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-[0.5rem] bg-gradient-to-br from-primary via-primary to-violet-600 text-[11px] font-bold text-white shadow-sm shadow-primary/25 transition-all duration-200 group-hover:shadow-md group-hover:shadow-primary/35 group-hover:scale-105">
                S
              </div>
              <span className="text-[0.9375rem] font-semibold tracking-tight text-foreground">AI Skills</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-[0.5rem] px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-[0.6875rem] h-px rounded-full bg-primary/70" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-[0.5rem] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-accent/60 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-5 py-7">{children}</main>

    </div>
  );
}
