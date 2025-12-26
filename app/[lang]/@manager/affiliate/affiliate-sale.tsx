"use client";

import useData from "@/hooks/useData";
import { getfeckdata } from "@/lib/data/course";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGlobalLoading } from "@/stores/uiStore";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export default function SalesChart() {
  const searchParams = useSearchParams();
  const [date, setDate] = useState({ start: new Date(), end: new Date() });
  const { data, loading } = useData({
    func: getfeckdata,
    args: [date],
  });

  useEffect(() => {
    setDate({
      start: searchParams?.get("start")
        ? new Date(searchParams.get("start")!)
        : new Date(),
      end: searchParams?.get("end")
        ? new Date(searchParams.get("end")!)
        : new Date(),
    });
  }, [searchParams]);

  const globalLoading = useGlobalLoading();
  
  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) return null;

  return (
    data && (
      <div className="bg-background/60 backdrop-blur-xl rounded-md shadow shadow-primary/10  ">
        <div className="py-5 px-5 md:px-10 grid max-md:gap-2 md:grid-cols-[1fr_auto]">
          <div className="">
            <p className="text-xl font-extrabold ">Affiliate Chart</p>
            {/* <p className="">showing total sales for {data.length} month </p> */}
          </div>
          <p className="">
            <span className="">{date.start.toDateString()}</span>
            <span className="px-5">-</span>
            <span className="">{date.end.toDateString()}</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <div
            className={cn(
              "h-80 min-w-[35rem] flex justify-center text-xs  ",
              "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 ",
              "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none",
              " [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
              " [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none"
            )}
          >
            <ResponsiveContainer className={""}>
              <AreaChart
                accessibilityLayer
                data={data}
                margin={{
                  left: 20,
                  right: 20,
                }}
              >
                <defs>
                  <linearGradient
                    id="colorAffiliate"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="rgb(var(--success-500))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(var(--success-500))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorSeller" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="rgb(var(--warning-500))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(var(--warning-500))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorOwn" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="rgb(var(--primary-500))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(var(--primary-500))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(var(--background)/0.8)",
                    borderRadius: 10,
                    backdropFilter: "blur(100px)",
                  }}
                  cursor={false}
                />
                <Legend
                  wrapperStyle={{ padding: "20px 0px" }}
                  iconType="square"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  // tickFormatter={(value) => value.slice(0, 3)}
                />
                <Area
                  dataKey="affiliate"
                  type="natural"
                  fill="url(#colorAffiliate)"
                  fillOpacity={0.4}
                  stroke="rgb(var(--success-500))"
                />
                <Area
                  dataKey="seller"
                  type="natural"
                  fill="url(#colorSeller)"
                  fillOpacity={0.4}
                  stroke="rgb(var(--warning-500))"
                />
                <Area
                  dataKey="own"
                  type="natural"
                  fill="url(#colorOwn)"
                  fillOpacity={0.4}
                  stroke="rgb(var(--primary-500))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  );
}
