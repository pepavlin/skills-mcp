"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SuggestChangeButton } from "@/components/suggest-change-button";
import { LayoutDashboardIcon, ZapIcon, TagIcon, LogOutIcon } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true, icon: LayoutDashboardIcon },
  { href: "/dashboard/skills", label: "Skills", exact: false, icon: ZapIcon },
  { href: "/dashboard/tags", label: "Tags", exact: false, icon: TagIcon },
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm transition-shadow group-hover:shadow-md"
                style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 277), oklch(0.55 0.25 300))" }}
              >
                <ZapIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight">AI Skills</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>

      <SuggestChangeButton />
    </div>
  );
}
