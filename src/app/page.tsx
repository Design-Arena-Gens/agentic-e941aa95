import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = (await (getServerSession as unknown as (
    ...args: unknown[]
  ) => Promise<Session | null>)(authOptions)) as Session | null;
  if (!session?.user) {
    redirect("/login");
  }
  redirect("/dashboard");
}
