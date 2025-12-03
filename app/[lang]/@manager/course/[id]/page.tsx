"use client";

import React, { useCallback, useEffect, useState } from "react";
import useData from "@/hooks/useData";
import { getOverviewData } from "@/actions/manager/course";
import { useParams, useSearchParams } from "next/navigation";
import { Calendar, TrendingUp } from "lucide-react";
import { Button } from "@heroui/react";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import EmptyState from "@/components/ui/EmptyState";
import Overview01 from "../../_components/overview01";
import Overview02 from "../../_components/overview02";
import Overview03 from "../../_components/overview03";
import { useGlobalLoading } from "@/stores/uiStore";

export default function Page() {
  const params = useParams<{ id: string }>(),
    searchParams = useSearchParams(),
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
      args: [date, params?.id || ""],
    });

  useEffect(() => {
    setDate(getDate());
  }, [getDate]);

  const globalLoading = useGlobalLoading();

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) {
    return null;
  }

  // No data state
  if (!data) {
    return (
      <ScrollablePageWrapper>
        <PageHeader
          title="Course Analytics"
          subtitle="No analytics data available for this course."
        />
        <EmptyState
          icon={<TrendingUp className="size-16" />}
          title="No Data Available"
          description="There's no analytics data to display for this course at the moment."
          action={{
            label: "Refresh Data",
            onClick: () => window.location.reload(),
          }}
        />
      </ScrollablePageWrapper>
    );
  }

  // Success state with data
  return (
    <ScrollablePageWrapper>
      <PageHeader
        title="Course Analytics"
        subtitle="Detailed performance metrics and analytics for this course."
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

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="grid gap-6">
          <Section>
            <Overview01 data={data[0]} />
          </Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Section>
              <Overview02 height={300} data={data[2]} />
            </Section>
            <Section>
              <Overview02 height={300} data={data[3]} />
            </Section>
          </div>
        </div>
        <Section className="md:w-96">
          <Overview02 width={400} data={data[1]} />
        </Section>
      </div>

      <Section>
        <Overview03 data={data[4]} />
      </Section>

      {/* Add extra content to ensure scrolling */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Course Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Total Students</span>
              <span className="font-medium">456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Completion Rate</span>
              <span className="font-medium">78%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Average Rating</span>
              <span className="font-medium">4.5/5</span>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">New enrollment</div>
              <div className="text-neutral-600">2 hours ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Course updated</div>
              <div className="text-neutral-600">1 day ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Review submitted</div>
              <div className="text-neutral-600">2 days ago</div>
            </div>
          </div>
        </div>
      </div>
    </ScrollablePageWrapper>
  );
}
