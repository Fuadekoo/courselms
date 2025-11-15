"use client";
import useData from "@/hooks/useData";
import React, { useState } from "react";
import { Avatar, Button } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TTableData } from "@/lib/definations";
import CustomTable from "@/components/ui/custom-table";
import { getCourses } from "@/actions/instructor/course";

export default function Page() {
  const params= useParams<{ lang: string }>();
    const lang = params?.lang || "en",
      [tableData, setTableData] = useState<TTableData>({
      search: "",
      selectedKeys: new Set([]),
      visibleColumns: "all",
      sortDescriptor: {
        column: "title",
        direction: "ascending",
      },
      rowsPerPage: 50,
      currentPage: 1,
    }),
    { data, loading } = useData({
      func: getCourses,
      args: [tableData],
    });

  return (
    <CustomTable
      columns={[
        { label: "Thumbnail", key: "thumbnail" },
        { label: "Title", key: "title", sortable: true },
        { label: "Sale", key: "sale", sortable: true },
        { label: "Earn", key: "earn", sortable: true },
      ]}
      data={{
        list: data?.list ?? [],
        totalData: data?.totalData ?? 0,
        totalPage: data?.totalPage ?? 0,
      }}
      RenderCell={({ rowData, columnKey }) => {
        const cellValue =
          rowData[columnKey as keyof NonNullable<typeof data>["list"][0]];
        switch (columnKey) {
          case "thumbnail": {
            return <Avatar src={rowData.thumbnail} />;
          }
          case "title": {
            return (
              <Button
                variant="light"
                as={Link}
                href={`/${lang}/course/${rowData.id}`}
                className="min-w-80"
              >
                {lang == "en" ? rowData.titleEn : rowData.titleAm}
              </Button>
            );
          }
          default: {
            return `${cellValue}`;
          }
        }
      }}
      btns={<></>}
      tableData={tableData}
      setTableData={setTableData}
      loadingState={loading ? "loading" : "idle"}
    />
  );
}
