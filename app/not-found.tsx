"use client";
import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Show loading state for a brief period to allow Next.js to fully resolve the route
    // This gives time for any async route resolution or redirects to complete
    const checkTimer = setTimeout(() => {
      setIsChecking(false);
    }, 800); // 800ms delay to check if route resolves

    return () => clearTimeout(checkTimer);
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-100 dark:from-neutral-950 dark:via-brand-950/50 dark:to-neutral-900">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium">
            Checking if page exists...
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Please wait while we verify the route
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-100 dark:from-neutral-950 dark:via-brand-950/50 dark:to-neutral-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* 404 Number with Animation */}
        <div className="mb-8 relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-purple-500 to-blue-500 leading-none animate-gradient">
            404
          </h1>
          <div className="absolute inset-0 blur-2xl opacity-30">
            <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-purple-500 to-blue-500 leading-none">
              404
            </h1>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            Oops! Page Not Found
          </h2>
          <div className="space-y-3 max-w-xl mx-auto">
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                Darul Kubra LMS System
              </span>
            </p>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              You are trying to access a page that is not found or not allowed.
              This could be because the page doesn&apos;t exist, has been moved,
              or you don&apos;t have permission to view it.
            </p>
            <p className="text-base text-neutral-700 dark:text-neutral-300 font-medium">
              Please go to home or use the navigation to find what you&apos;re
              looking for.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Go Back
          </button>

          <Link
            href="/en"
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-lg font-semibold hover:from-brand-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-brand-500/50"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            Go Home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            Need help? Try searching for what you need
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-lg px-4 py-3 border border-neutral-200 dark:border-neutral-800">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search for courses, topics..."
              className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value;
                  if (query)
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
