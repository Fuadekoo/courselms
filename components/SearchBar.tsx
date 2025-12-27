"use client";

import { useEffect, useState } from "react";
import Input from "./oldUI/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addQuery } from "@/lib/utils";

export default function SearchBar() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.push(
      pathname +
        "?" +
        addQuery((searchParams?.toString() ?? ""), [
          {
            name: "search",
            value: search,
          },
        ])
    );
  }, [search]);

  return (
    <div className="grid grid-cols-[1fr_auto] ">
      <Input
        control={undefined}
        placeholder="search here ..."
        value={search}
        onChange={({ target }) => setSearch(target.value)}
        className="[&>input]:bg-white/50 [&>input]:backdrop-blur [&>input]:rounded-full focus-visible:[&>input]:rounded-full"
      />
      <p className="px-4 content-center text-center">
        {(searchParams?.get("date")
          ? new Date(searchParams.get("date")!)
          : new Date()
        ).toDateString()}
      </p>
    </div>
  );
}
