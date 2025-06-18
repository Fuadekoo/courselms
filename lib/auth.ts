import NextAuth, { CredentialsSignin, NextAuthConfig } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import prisma from "./db";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
    code?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    code?: string;
  }
}

export class CustomError extends CredentialsSignin {
  CustomError(code: string) {
    this.code = code;
  }
}

const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
  trustHost: true,
  callbacks: {
    authorized: async ({}) => {
      // if (auth && url.includes("/login")) {
      //   return Response.redirect(new URL("/", nextUrl));
      // } else
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.code = user.code;
      }
      return token;
      // return { ...token, ...user };
    },
    session: async ({ session, token }) => {
      if (token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.code = token.code;
      }
      return session;
      // return { ...session, user: { ...session.user, ...token } };
    },
  },
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const { userName, password } = z
            .object({
              userName: z.string(),
              password: z.string(),
            })
            .parse(credentials),
          user = await prisma.user.findFirst({
            where: { phoneNumber: userName },
            select: { id: true, role: true, code: true, password: true },
          });
        if (user) {
          if (await bcryptjs.compare(password, user.password)) {
            if (user.role === "employee") {
              await prisma.user.update({
                where: { id: user.id },
                data: { password: "" },
              });
            }
            return user;
          }
          throw new CustomError("password");
        }
        throw new CustomError("username");
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
