"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Calendar, TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import { Button } from "@heroui/react";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import StatCard from "@/components/ui/StatCard";
import Overview01 from "../_components/overview01";
import Overview02 from "../_components/overview02";
import Overview03 from "../_components/overview03";
import { getOverviewData } from "@/actions/manager/course";
import useData from "@/hooks/useData";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/loading";

export default function Page() {
  const searchParams = useSearchParams(),
    getDate = useCallback(() => {
      const startDate = searchParams?.get("startDate"),
        endDate = searchParams?.get("endDate"),
        now = new Date();

      return {
        start: startDate
          ? new Date(startDate)
          : new Date(now.getFullYear(), now.getMonth(), 1),
        end: endDate
          ? new Date(endDate)
          : new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    }, [searchParams]),
    [date, setDate] = useState<ReturnType<typeof getDate>>(getDate),
    { data, loading } = useData({
      func: getOverviewData,
      args: [date],
    });

  useEffect(() => {
    const value = getDate();
    setDate(value);
  }, [getDate]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Manager Dashboard"
          subtitle="No data available at the moment."
        />
        <div className="card p-8 text-center">
          <TrendingUp className="size-16 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No Data Available
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            There is no analytics data to display for the selected period.
          </p>
          <Button
            color="primary"
            variant="flat"
            onPress={() => window.location.reload()}
          >
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  // Success state with data
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        subtitle="Comprehensive overview of platform analytics and performance metrics."
        actions={
          <Button
            color="primary"
            variant="flat"
            startContent={<Calendar className="size-4" />}
            size="sm"
          >
            Filter by Date
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users className="size-6" />}
          label="Total Sales"
          value={data[0]?.find(item => item.label === "Sale")?.value || 0}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          icon={<BookOpen className="size-6" />}
          label="Total Courses"
          value={data[0]?.find(item => item.label === "Course")?.value || 0}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          icon={<DollarSign className="size-6" />}
          label="Total Revenue"
          value={`ETB ${data[0]?.find(item => item.label === "Earn ETB")?.value || 0}`}
          trend={{ value: 25, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics */}
        <Section
          title="Platform Analytics"
          className="lg:col-span-2"
        >
          <Overview01 data={data[0]} />
        </Section>

        {/* Quick Stats */}
        <Section
          title="Quick Stats"
          description="Key performance indicators"
        >
          <div className="space-y-4">
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Conversion Rate</span>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">12.5%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-brand-500 h-2 rounded-full" style={{ width: "12.5%" }} />
              </div>
            </div>
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">User Satisfaction</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">94%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Course Completion</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">78%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section>
          <Overview02 height={300} data={data[2]} />
        </Section>
        <Section>
          <Overview02 height={300} data={data[3]} />
        </Section>
      </div>

      {/* Comprehensive Overview */}
      <Section>
        <Overview03 data={data[4]} />
      </Section>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="Performance Metrics">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Page Load Time</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">1.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Uptime</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Response Time</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">245ms</span>
            </div>
          </div>
        </Section>
        <Section title="System Health">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">CPU Usage</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Memory Usage</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">2.1GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Storage</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">78%</span>
            </div>
          </div>
        </Section>
        <Section title="Recent Activity">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">New Users Today</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Courses Started</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Courses Completed</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">8</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
