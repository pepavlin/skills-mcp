"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SuggestChangeButton } from "@/components/suggest-change-button";

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
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-7">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 text-[11px] font-bold text-white shadow-sm shadow-primary/30 transition-shadow group-hover:shadow-primary/50">
                S
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">AI Skills</span>
            </Link>

            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>

      <SuggestChangeButton />
    </div>
  );
}
