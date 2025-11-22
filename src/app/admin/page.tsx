import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/layout/dashboard-shell";
import AdminPanel from "@/components/panels/admin-panel";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getRecentSignals } from "@/lib/signals";

export default async function AdminPage() {
  const session = (await (getServerSession as unknown as (
    ...args: unknown[]
  ) => Promise<Session | null>)(authOptions)) as Session | null;
  if (!session?.user) {
    redirect("/login");
  }
  const { user } = session;
  if ((user.role ?? "USER") !== "ADMIN") {
    redirect("/dashboard");
  }

  const [settings, signals] = await Promise.all([
    getSettings(),
    getRecentSignals(10),
  ]);

  return (
    <DashboardShell>
      <AdminPanel settings={settings} recentSignals={signals} />
    </DashboardShell>
  );
}
