import NextAuth, { CredentialsSignin, NextAuthConfig } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
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
    signIn: async ({ user, account, profile }) => {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user exists by email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Update user info if needed
            user.id = existingUser.id;
            user.role = existingUser.role;
            user.code = existingUser.code;
            return true;
          }

          // Create new user for Google OAuth
          // Generate a unique phone number for OAuth users (format: oauth_google_{timestamp}_{random})
          const uniquePhoneNumber = `oauth_google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // Extract name from Google profile
          const nameParts = user.name?.split(" ") || [];
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              phoneNumber: uniquePhoneNumber,
              firstName: firstName,
              lastName: lastName,
              password: "", // OAuth users don't need password
              role: "student", // Default role for OAuth users
            },
          });

          user.id = newUser.id;
          user.role = newUser.role;
          user.code = newUser.code;
          return true;
        } catch (error) {
          console.error("Error in Google OAuth sign-in:", error);
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.code = user.code;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Always populate user.id if token.id exists (even without role)
      if (token.id) {
        session.user.id = token.id;
        if (token.role) {
          session.user.role = token.role;
        }
        if (token.code) {
          session.user.code = token.code;
        }
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      authorize: async (credentials) => {
        // Lazy import bcryptjs to avoid bundling it in Edge Runtime (middleware)
        const bcryptjs = (await import("bcryptjs")).default;
        
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
