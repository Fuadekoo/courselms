"use client";

import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import { Pen, Plus, Trash } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import { getCoursesList } from "@/actions/manager/course";
import { getSellers, removeSeller } from "@/actions/manager/seller";
import CustomTable from "@/components/ui/custom-table";
import { TTableData } from "@/lib/definations";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import {
  startOfMonth,
  endOfMonth,
  today,
  getLocalTimeZone,
} from "@internationalized/date";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Selection,
} from "@heroui/react";
import UserStatusToggle from "@/components/userStatusToggle";
import CustomDatePicker from "@/components/ui/custom-date-picker";
// import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
// import { startOfMonth, endOfMonth, today, getLocalTimeZone } from "@internationalized/date";

export default function Page() {
  const params = useParams<{ lang: string }>(),
    lang = params?.lang || "en",
    pathname = usePathname(),
    [tableData, setTableData] = useState<
      TTableData & {
        status: Selection;
        date: { start: Date; end: Date };
      }
    >({
      visibleColumns: "all",
      selectedKeys: new Set([]),
      sortDescriptor: { column: "", direction: "ascending" },
      search: "",
      currentPage: 1,
      rowsPerPage: 50,
      status: new Set([]),
      date: {
        start: new Date(startOfMonth(today(getLocalTimeZone())).toString()),
        end: new Date(endOfMonth(today(getLocalTimeZone())).toString()),
      },
    }),
    { data, loading, refresh } = useData({
      func: getSellers,
      args: [tableData],
    }),
    [remove, setRemove] = useState<string>();

  useData({
    func: getCoursesList,
    args: [],
    onSuccess(allCourse) {
      setTableData((prev) => ({ ...prev, allCourse }));
    },
  });

  return (
    <ScrollablePageWrapper>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{lang === "en" ? "Seller Management" : "የሻጭ አስተዳደር"}</h1>
            <p className="text-gray-600">{lang === "en" ? "Manage seller accounts and their sales performance." : "የሻጭ መለያዎችን እና የሽያጭ አፈጻጸማቸውን ያስተዳድሩ።"}</p>
          </div>
          <Button
            size="sm"
            color="primary"
            endContent={<Plus className="size-4" />}
            as={Link}
            href={`${pathname}/registration`}
          >
            {lang === "en" ? "Add New Seller" : "አዲስ ሻጭ ጨምር"}
          </Button>
        </div>
        <CustomTable
        columns={[
          { label: lang == "en" ? "Name" : "ስም", key: "name", sortable: true },
          {
            label: lang == "en" ? "Total Sale" : "ጠቅላላ ሽያጭ",
            key: "totalSale",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "Total Income" : "ጠቅላላ ገቢ",
            key: "totalIncome",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "Filtered Sale" : "የዚህ ወር ሽያጭ",
            key: "filteredSale",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "Filtered Income" : "የዚህ ወር ገቢ",
            key: "filteredIncome",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "This Month Sale" : "የዚህ ወር ሽያጭ",
            key: "thisMonthSale",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "This Month Income" : "የዚህ ወር ገቢ",
            key: "thisMonthIncome",
            sortable: true,
            align: "center",
          },
          {
            label: lang == "en" ? "Status" : "",
            key: "status",
            align: "center",
          },
          {
            label: lang == "en" ? "Actions" : "",
            key: "actions",
            align: "center",
          },
        ]}
        data={{
          list: data?.list ?? [],
          totalData: data?.totalData ?? 0,
          totalPage: data?.totalPage ?? 1,
        }}
        RenderCell={({ rowData, columnKey }) => {
          const value = rowData[columnKey as keyof typeof rowData];

          switch (columnKey) {
            case "name": {
              return (
                <Button
                  size="sm"
                  variant="light"
                  className="justify-start"
                  as={Link}
                  href={`/${pathname?.split("/")[1]}/seller/${rowData.id}`}
                >
                  {`${rowData.firstName} ${rowData.fatherName} ${rowData.lastName}`}
                </Button>
              );
            }
            case "status": {
              return (
                <div className="grid place-content-center">
                  <UserStatusToggle
                    id={rowData.id}
                    status={rowData.status}
                    refresh={refresh}
                  />
                </div>
              );
            }
            case "actions": {
              return (
                <div className=" flex gap-2 justify-center ">
                  <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    isIconOnly
                    as={Link}
                    href={`/${pathname?.split("/")[1]}/seller/registration/${
                      rowData.id
                    }`}
                  >
                    <Pen className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isIconOnly
                    onPress={() => setRemove(rowData.id)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              );
            }
            default: {
              return value;
            }
          }
        }}
        loadingState={loading ? "loading" : "idle"}
        selectable
        tableData={tableData}
        setTableData={setTableData}
        btns={
          <>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="capitalize"
                >
                  {((v) => (v.length === 1 ? v : "status"))(
                    Array.from(tableData.status)
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                variant="flat"
                color="primary"
                selectionMode="multiple"
                closeOnSelect={false}
                aria-label="Table Status"
                selectedKeys={tableData.status}
                onSelectionChange={(status) =>
                  setTableData((prev) => ({ ...prev, status }))
                }
              >
                {["active", "inactive"].map((v) => (
                  <DropdownItem key={v} className="capitalize ">
                    {v}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <CustomDatePicker
              date={tableData.date}
              setDate={(date) =>
                setTableData((prev) => ({ ...prev, date: date ?? prev.date }))
              }
              visibleMonths={2}
            />
            <Button
              size="sm"
              color="primary"
              endContent={<Plus className="size-4" />}
              as={Link}
              href={`/${pathname?.split("/")[1]}/seller/registration`}
            >
              Add New
            </Button>
          </>
        }
        />
        {remove && (
          <RemoveSeller
            id={remove}
            refresh={refresh}
            onOpenChange={() => setRemove(undefined)}
          />
        )}
      </div>
    </ScrollablePageWrapper>
  );
}

function RemoveSeller({
  id,
  refresh,
  onOpenChange,
}: {
  id: string;
  refresh: () => void;
  onOpenChange: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en",
    { action, isPending } = useAction(removeSeller, undefined, {
      loading: lang == "en" ? "deleting seller" : "አስተዳዳሪን በመሰረዝ ላይ",
      success:
        lang == "en" ? "successfully deleted seller" : "አስተዳዳሪ በተሳካ ሁኔታ ተሰርዟል",
      error: lang == "en" ? "failed to delete seller" : "አስተዳዳሪን መሰረዝ አልተሳካም",
      onSuccess() {
        refresh();
        onOpenChange();
      },
    });

  return (
    <Modal
      isOpen={true}
      onOpenChange={onOpenChange}
      classNames={{ wrapper: "p-5" }}
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger text-center">
              {lang == "en" ? "Seller Deletion" : "የአስተዳዳሪ መሰረዝ"}
            </ModalHeader>
            <ModalBody>
              {lang == "en" ? (
                <span>
                  Are you sure you want to{" "}
                  <span className="text-danger">delete</span> the seller?
                </span>
              ) : (
                <span>
                  እርግጠኛ ነዎት አስተዳዳሪን <span className="text-danger">መሰረዝ</span>{" "}
                  ይፈልጋሉ?
                </span>
              )}
            </ModalBody>
            <ModalFooter className="grid gap-5 grid-cols-2">
              <Button variant="flat" onPress={() => onClose()}>
                {lang == "en" ? "Back" : "ተመለስ"}
              </Button>
              <Button
                color="danger"
                onPress={() => action(id)}
                isLoading={isPending}
              >
                {lang == "en" ? "Delete" : "ሰርዝ"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}