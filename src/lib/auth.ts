import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcrypt";
import { z } from "zod";

import prisma from "./prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: Record<string, unknown> & { role?: string };
      user?: { role?: string } | null;
    }) {
      if (user) {
        token.role = (user as { role?: string })?.role ?? "USER";
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: Record<string, unknown> & { role?: string; sub?: string };
    }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "USER";
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
