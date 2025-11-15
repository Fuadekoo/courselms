"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import Overview01 from "../../@manager/_components/overview01";
import Overview02 from "../../@manager/_components/overview02";
import Overview03 from "../../@manager/_components/overview03";
import useData from "@/hooks/useData";
import { useSearchParams, useParams } from "next/navigation";
import { getOverview } from "@/actions/instructor/overview";

export default function Page() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const searchParams = useSearchParams();
  const [filterData, setFilterData] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  
  const { data, loading, error } = useData({
    func: getOverview,
    args: [filterData],
  });

  useEffect(() => {
    const startDateParam = searchParams?.get("startDate") ?? "",
      endDateParam = searchParams?.get("endDate") ?? "",
      startDate = new Date(startDateParam),
      endDate = new Date(endDateParam);
      
    setFilterData({
      start: String(startDate) === "Invalid Date" ? undefined : startDate,
      end: String(endDate) === "Invalid Date" ? undefined : endDate,
    });
  }, [searchParams]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-neutral-600 dark:text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.replace(`/${lang}/dashboard`);
    }
    return (
      <EmptyState
        icon={<Shield className="size-16" />}
        title="Authentication Required"
        description="Please log in to access the instructor dashboard."
        action={{
          label: "Go to Login",
          onClick: () => window.location.href = `/${lang}/login`
        }}
      />
    );
  }

  // Access denied state
  if (session?.user?.role !== 'instructor') {
    if (typeof window !== "undefined") {
      window.location.replace(`/${lang}/dashboard`);
    }
    return (
      <EmptyState
        icon={<AlertTriangle className="size-16" />}
        title="Access Denied"
        description={`You need instructor privileges to access this page. Current role: ${session?.user?.role || 'Unknown'}`}
      />
    );
  }

  // Loading data state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Instructor Dashboard"
          subtitle="Loading your analytics and overview..."
        />
        <div className="grid gap-6">
          <div className="card p-6">
            <div className="h-32 skeleton" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="h-64 skeleton" />
            </div>
            <div className="card p-6">
              <div className="h-64 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-16" />}
        title="Error Loading Dashboard"
        description="There was an issue loading your dashboard data."
        action={{
          label: "Retry",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  // No data state
  if (!data) {
    return (
      <EmptyState
        icon={<RefreshCw className="size-16" />}
        title="No Data Available"
        description="There's no data to display at the moment."
        action={{
          label: "Refresh",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  // Success state with data
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor Dashboard"
        subtitle="Monitor your courses, students, and performance metrics."
      />
      
      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="grid gap-6">
          <Section>
            <Overview01 data={data[0]} />
          </Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Section>
              <Overview02 height={300} data={data[2]} />
            </Section>
          </div>
        </div>
        <Section className="md:w-96">
          <Overview02 width={400} data={data[1]} />
        </Section>
      </div>
      
      <Section>
        <Overview03 data={data[3]} />
      </Section>
    </div>
  );
}