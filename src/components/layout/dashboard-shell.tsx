"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden min-h-screen w-60 border-r border-slate-800/60 bg-slate-950/80 px-6 py-10 md:flex md:flex-col md:gap-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-400/80">
            Signal Hub
          </p>
          <h1 className="mt-2 text-lg font-semibold">Binary Options</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-300 hover:bg-slate-900/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-auto inline-flex items-center justify-center rounded-lg border border-slate-700/80 px-3 py-2 text-xs uppercase tracking-wide text-slate-300 transition hover:bg-slate-900/60"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/70 px-6 py-4 backdrop-blur">
          <div className="md:hidden">
            <p className="text-xs uppercase tracking-widest text-cyan-400/80">
              Signal Hub
            </p>
            <h1 className="text-lg font-semibold">Binary Options</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-slate-700/80 px-3 py-2 text-xs uppercase tracking-wide text-slate-300 transition hover:bg-slate-900/60 md:hidden"
          >
            Sign out
          </button>
        </header>
        <div className="px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
