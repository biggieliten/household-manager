import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma.ts";

export const auth = betterAuth({
  plugins: [expo()],
  trustedOrigins: [
    "http://localhost:3000",
    "household-manager://",
    ...(process.env.NODE_ENV !== "production" ? ["exp://", "exp://**"] : []),
  ],
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
