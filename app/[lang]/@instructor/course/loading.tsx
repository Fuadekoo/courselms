import React from "react";
import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="size-full grid place-content-center">
      <Spinner />
    </div>
  );
}
