"use client";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { TCourse } from "@/lib/definations";
import { CInput, CSelect, CSelectItem, CTextarea } from "../heroui";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TimePicker from "./TimePicker";

interface CourseBasicInfoProps {
  lang: string;
  register: UseFormRegister<TCourse>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: (key: string) => any;
  setValue: UseFormSetValue<TCourse>;
}

export default function CourseBasicInfo({
  lang,
  register,
  watch,
  setValue,
}: CourseBasicInfoProps) {
  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300 overflow-visible">
      <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <CInput
          label={lang === "en" ? "Title : English" : "ርዕስ : እንግሊዝኛ"}
          color="primary"
          value={watch ? watch("titleEn") : ""}
          {...register("titleEn")}
          className="w-full"
        />
        <CInput
          label={lang === "en" ? "Title : Amharic" : "ርዕስ : አማርኛ"}
          color="primary"
          value={watch ? watch("titleAm") : ""}
          {...register("titleAm")}
          className="w-full"
        />
        <CInput
          label={lang === "en" ? "Affiliate Price" : "የተባባሪ ዋጋ"}
          type="number"
          color="primary"
          value={watch ? watch("price")?.toString() : ""}
          {...register("price", { valueAsNumber: true })}
          endContent={<span className="text-sm text-gray-500">ETB</span>}
          className="w-full"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <CInput
          label={lang === "en" ? "Dollar Price" : "የዶላር ዋጋ"}
          type="number"
          color="primary"
          value={watch ? watch("dolarPrice")?.toString() : ""}
          {...register("dolarPrice", { valueAsNumber: true })}
          min="0"
          endContent={<span className="text-sm text-gray-500">USD</span>}
          className="w-full"
        />
        <CInput
          label={lang === "en" ? "Birr Price" : "የብር ዋጋ"}
          type="number"
          color="primary"
          value={watch ? watch("birrPrice")?.toString() : ""}
          {...register("birrPrice", { valueAsNumber: true })}
          min="0"
          endContent={<span className="text-sm text-gray-500">ETB</span>}
          className="w-full"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
        <CTextarea
          {...register("aboutEn")}
          label={
            lang === "en" ? "About the course : English" : "ስለ ኮርሱ : እንግሊዝኛ"
          }
          color="primary"
          value={watch ? watch("aboutEn") : ""}
          minRows={3}
          className="w-full"
          classNames={{
            input: "break-words overflow-wrap-anywhere",
          }}
        />
        <CTextarea
          {...register("aboutAm")}
          label={lang === "en" ? "About the course : Amharic" : "ስለ ኮርሱ : አማርኛ"}
          color="primary"
          value={watch ? watch("aboutAm") : ""}
          minRows={3}
          className="w-full"
          classNames={{
            input: "break-words overflow-wrap-anywhere",
          }}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <CSelect
          {...register("level")}
          label={lang === "en" ? "Level" : "ደረጃ"}
          color="primary"
          selectedKeys={watch("level") ? [watch("level")] : []}
          className="w-full"
        >
          {["beginner", "intermediate", "advanced"].map((v) => (
            <CSelectItem
              key={v}
              textValue={v.charAt(0).toUpperCase() + v.slice(1)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </CSelectItem>
          ))}
        </CSelect>
        <div className="w-full ">
          <TimePicker
            value={watch ? watch("duration") : ""}
            onChange={(value: string) => setValue("duration", value)}
            label={lang === "en" ? "Duration (Optional)" : "ቆይታ (አማራጭ)"}
            placeholder={lang === "en" ? "e.g., 01:09:09" : "ለምሳሌ፣ 01:09:09"}
          />
        </div>
        <CInput
          {...register("language")}
          label={lang === "en" ? "Language" : "ቋንቋ"}
          color="primary"
          value={watch ? watch("language") : ""}
          className="w-full"
        />
      </div>
    </div>
  );
}
