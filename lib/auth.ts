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
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Extract language from URL (e.g., /en/login or /am/login)
      const langMatch = pathname.match(/^\/(en|am)/);
      const lang = langMatch ? langMatch[1] : "en";

      // Check if user is trying to access login/signup pages
      const isAuthPage =
        pathname.includes("/login") || pathname.includes("/signup");

      // If logged in and trying to access auth pages, redirect to appropriate dashboard
      if (isLoggedIn && isAuthPage && auth.user) {
        const role = auth.user.role;
        let redirectPath = `/${lang}`;
        
        if (role === "instructor") {
          redirectPath = `/${lang}/dashboard`;
        } else if (role === "manager") {
          redirectPath = `/${lang}/manager`;
        } else if (role === "student") {
          redirectPath = `/${lang}/course`;
        }
        
        return Response.redirect(new URL(redirectPath, request.nextUrl.origin));
      }

      // Allow all other routes
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
            .parse(credentials);
        
        // Try to find user by phone number or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: userName },
              { email: userName },
            ],
          },
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
