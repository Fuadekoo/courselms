"use client";

import React, { useEffect, useState } from "react";
import Loading from "@/components/loading";
import NoData from "@/components/noData";
import Overview01 from "../../../@manager/_components/overview01";
import Overview02 from "../../../@manager/_components/overview02";
import Overview03 from "../../../@manager/_components/overview03";
import useData from "@/hooks/useData";
import { useSearchParams, useParams } from "next/navigation";
import { getOverview } from "@/actions/instructor/overview";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "",
    searchParams = useSearchParams(),
    [filterData, setFilterData] = useState<{
      start: Date | undefined;
      end: Date | undefined;
      id: string;
    }>({ start: undefined, end: undefined, id }),
    { data, loading } = useData({
      func: getOverview,
      args: [filterData],
    });

  useEffect(() => {
    const startDate = new Date(searchParams?.get("startDate") ?? ""),
      endDate = new Date(searchParams?.get("endDate") ?? "");
    setFilterData((prev) => ({
      ...prev,
      start: String(startDate) == "Invalid Date" ? undefined : startDate,
      end: String(endDate) == "Invalid Date" ? undefined : endDate,
    }));
  }, [searchParams]);

  return loading ? (
    <Loading />
  ) : !data ? (
    <NoData />
  ) : (
    <div className="overflow-auto">
      <div className="py-4 grid gap-4 md:grid-cols-[1fr_auto] ">
        <div className="grid gap-4">
          <Overview01 data={data[0]} />
          <div className="grid gap-4 md:grid-cols-2">
            <Overview02 height={300} data={data[2]} />
          </div>
        </div>
        <Overview02 width={400} data={data[1]} />
      </div>
      <Overview03 data={data[3]} />
    </div>
  );
}
