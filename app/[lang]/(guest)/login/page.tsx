"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAction from "@/hooks/useAction";
import { authenticate } from "@/lib/action/user";
import { CButton } from "@/components/heroui";
import { Form, Input } from "@heroui/react";
import Loading from "@/components/loading";

const formSchema = z.object({
  userName: z.string({ message: "" }).nonempty("User Name is required"),
  password: z.string({ message: "" }).nonempty("Password is required"),
});

export default function Page() {
  const params = useParams<{ lang: string }>(),
    lang = params?.lang ?? "en",
    { handleSubmit, register, formState } = useForm<z.infer<typeof formSchema>>(
      {
        resolver: zodResolver(formSchema),
        defaultValues: { userName: "", password: "" },
      }
    ),
    router = useRouter(),
    { data: session, status } = useSession(),
    { action, isPending } = useAction(authenticate, undefined, {
      onSuccess(state) {
        // Handle client-side redirect after successful login
        if (state.status && state.redirect) {
          window.location.href = state.redirect;
        }
      },
      success: lang == "en" ? "Successfully logged in" : "በተሳካ ሁኔታ ገብተዋል",
      error: lang == "en" ? "Logged in failed" : "መግባት አልተሳካም",
    });

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      let redirectPath = `/${lang}`;
      
      if (role === "instructor") {
        redirectPath = `/${lang}/dashboard`;
      } else if (role === "manager") {
        redirectPath = `/${lang}/manager`;
      } else if (role === "student") {
        redirectPath = `/${lang}/course`;
      }
      
      router.replace(redirectPath);
    }
  }, [status, session, router, lang]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // If authenticated, don't render login form (will redirect)
  if (status === "authenticated") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Process phone numbers: handle leading 0 and add default country code
  const processPhoneNumber = (userName: string): string => {
    // Remove all whitespace
    const cleaned = userName.trim();
    
    // Check if it's a phone number starting with 0 (national format)
    if (/^0\d{9,}$/.test(cleaned)) {
      // Remove leading 0 and add default country code (+251 Ethiopia)
      return `+251${cleaned.substring(1)}`;
    }
    
    // If it's a 9-digit number starting with 9 or 7 (Ethiopian format without 0)
    if (/^[97]\d{8}$/.test(cleaned)) {
      // Add +251 prefix (default country)
      return `+251${cleaned}`;
    }
    
    // If already has + (international format), return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Return as is for other formats (usernames, emails, etc.)
    return cleaned;
  };

  // Custom login handler to process phone numbers
  const handleLogin = (data: z.infer<typeof formSchema>) => {
    const processedUserName = processPhoneNumber(data.userName);
    action({ userName: processedUserName, password: data.password });
  };

  const handleForgotPassword = () => {
    router.push(`/${lang}/forgetPassword`);
  };

  const handleSignUp = () => {
    router.push(`/${lang}/signup`);
  };

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Enhanced Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-dvh p-4 grid content-center md:justify-center">
        <div className="w-full max-w-md">
          {/* Enhanced Form Card */}
          <div className="relative">
            {/* Glass morphism effect */}
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl"></div>
            
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 dark:from-blue-400/10 dark:via-transparent dark:to-indigo-400/10 rounded-2xl"></div>
            
            <Form
              onSubmit={handleSubmit(handleLogin)}
              validationErrors={Object.entries(formState.errors).reduce(
                (a, [key, { message }]) => {
                  return { ...a, [key]: message };
                },
                {}
              )}
              className="relative z-10 w-full py-12 px-8 grid gap-6"
            >
              {/* Logo Section */}
              <div className="grid place-content-center mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-lg opacity-20 dark:opacity-30"></div>
                  <div className="relative">
                    <Logo />
                  </div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === "en" ? "Welcome Back" : "እንኳን ደህና መጡ"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === "en" ? "Sign in to your account" : "ወደ መለያዎ ይግቡ"}
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid gap-5">
                <div className="space-y-1">
                  <Input
                    color="primary"
                    variant="bordered"
                    size="lg"
                    classNames={{
                      input: "text-gray-900 dark:text-white",
                      inputWrapper: "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-colors",
                    }}
                    {...register("userName")}
                    placeholder={lang == "en" ? "Phone number or username" : "የስልክ ቁጥር ወይም የተጠቃሚ ስም"}
                    
                  />
                </div>
                
                <div className="space-y-1">
                  <Input
                    color="primary"
                    variant="bordered"
                    size="lg"
                    type="password"
                    classNames={{
                      input: "text-gray-900 dark:text-white",
                      inputWrapper: "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-colors",
                    }}
                    {...register("password")}
                    placeholder={lang == "en" ? "Enter your password" : "የይለፍ ቃልዎን ያስገቡ"}
                  />
                </div>

                {/* Enhanced Login Button */}
                <CButton 
                  type="submit" 
                  color="primary" 
                  size="lg"
                  isLoading={isPending}
                  className="w-full font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 dark:from-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isPending 
                    ? (lang === "en" ? "Signing in..." : "በመግባት ላይ...") 
                    : (lang === "en" ? "Sign In" : "ይግቡ")
                  }
                </CButton>
              </div>

              {/* Enhanced Footer Links */}
              <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 leading-relaxed">
                  {lang == "en" ? (
                    <>
                      <button
                        type="button" 
                        onClick={handleForgotPassword}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                      >
                        Forgot Password?
                      </button>
                      <br className="sm:hidden" />
                      <span className="hidden sm:inline"> • </span>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={handleSignUp}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                      >
                        የይለፍ ቃል ረሳሁ?
                      </button>
                      <br className="sm:hidden" />
                      <span className="hidden sm:inline"> • </span>
                      ምልክት ካላደረጉ{" "}
                      <button
                        type="button"
                        onClick={handleSignUp}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                      >
                        ይመዝገቡ
                      </button>
                    </>
                  )}
                </p>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
