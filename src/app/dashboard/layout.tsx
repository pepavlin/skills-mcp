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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="flex h-11 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 text-[10px] font-bold text-white">
                S
              </span>
              AI Skills
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
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-zinc-700"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
