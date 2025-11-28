"use client";

import { CButton, CInput, CSelect, CSelectItem } from "@/components/heroui";
import useAction from "@/hooks/useAction";
import { sendSMSToCustomer } from "@/lib/action";
import sale from "@/lib/action/order";
import { cn } from "@/lib/utils";
import { studentSchema } from "@/lib/zodSchema";
import { Button, Form } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function Page() {
  const params = useParams<{ lang: string; id: string[] }>();
  const lang = params?.lang || "";
  const idParams = params?.id || [];
  
  // Extract id, price, and title from the array
  const id = idParams[0] || "";
  const price = idParams[1] || "";
  const title = idParams[2] || "";

  const formSchema = z.intersection(
    studentSchema,
    z.object({
      transactionImage: z
        .string({ message: "" })
        .nonempty("Transaction Image is required"),
      transactionNumber: z
        .string({ message: "" })
        .nonempty("Transaction Number is required"),
      transactionAmount: z.coerce
        .number({ message: "Transaction Amount is required" })
        .gte(
          Number(price) || 0,
          `It must be greater than or equal to ${Number(price) || 0}`
        ),
      price: z.coerce
        .number({ message: "required" })
        .gt(0, "It must be greater than 0"),
    })
  );

  const { handleSubmit, register, getValues, setValue, formState } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      firstName: "",
      fatherName: "",
      lastName: "",
      gender: "Female",
      age: "",
      country: "",
      region: "",
      city: "",
      phoneNumber: "",
      transactionImage: "",
      transactionNumber: "",
      transactionAmount: Number(price) || 0,
      price: Number(price) || 0,
    },
  });

  const [img, setImg] = useState<string>();
  const router = useRouter();
  
  const { action, isPending, state } = useAction(sale, undefined, {
    success: lang == "en" ? "Sale completed" : "ሽያጩ ተጠናቅቋል",
    error: lang == "en" ? "Sale failed" : "ሽያጭ አልተሳካም።",
    onSuccess(state) {
      if (state.status) {
        router.push(`/${lang}/course`);
      }
    },
    onError() {},
  });

  return (
    <div className="grid justify-center overflow-auto">
      <Form
        onSubmit={handleSubmit(action)}
        validationErrors={Object.entries(formState.errors).reduce(
          (a, [key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...a, [key]: (value as any).message };
          },
          {}
        )}
        className="px-2 md:px-10 py-5 rounded-xl grid gap-3 bg-primary/20"
      >
        <p className="p-2 font-semibold text-center  ">
          {lang === "en"
            ? decodeURIComponent(title).split("@")[0]
            : decodeURIComponent(title).split("@")[1]}
        </p>
        <div className="grid gap-10 md:grid-cols-2 items-center- ">
          <label
            className={cn(
              "md:w-80 aspect-square md:place-self-center overflow-hidden"
            )}
          >
            <input
              type="file"
              className="hidden"
              onChange={async ({ target }) => {
                if (target.files?.[0]) {
                  const data = URL.createObjectURL(target.files[0]);
                  setValue(
                    "transactionImage",
                    Buffer.from(await target.files[0].arrayBuffer()).toString(
                      "base64"
                    ),
                    { shouldValidate: true }
                  );
                  setImg(data);
                } else {
                  setValue("transactionImage", "", { shouldValidate: true });
                  setImg(undefined);
                }
              }}
            />
            <Image
              src={img || "/darulkubra.png"}
              alt=""
              height={1000}
              width={1000}
              className={cn(
                "size-full rounded-xl overflow-hidden",
                formState.errors.transactionImage
                  ? "bg-danger-600/20 border-2 border-danger-300"
                  : "bg-primary-600/20"
              )}
            />
            {formState.errors.transactionImage && (
              <p className={cn("text-xs text-center text-danger-800")}>
                {formState.errors.transactionImage.message}
              </p>
            )}
          </label>
          <div className="grid gap-2 items-center ">
            <CInput
              label={lang === "en" ? "First Name" : "የመጀመሪያ ስም"}
              {...register("firstName")}
            />
            <CInput
              label={lang === "en" ? "Father Name" : "የአባት ስም"}
              {...register("fatherName")}
            />
            <CInput
              label={lang === "en" ? "Last Name" : "የአያት ስም"}
              {...register("lastName")}
            />
            <CSelect
              label={lang === "en" ? "Gender" : "ፆታ"}
              {...register("gender")}
            >
              {["Female", "Male"].map((v) => (
                <CSelectItem key={v} textValue={v}>{v}</CSelectItem>
              ))}
            </CSelect>
            <CInput
              label={lang === "en" ? "Age" : "እድሜ"}
              {...register("age")}
            />
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <CInput
            label={lang === "en" ? "Country" : "ሃገር"}
            {...register("country")}
          />
          <CInput
            label={lang === "en" ? "Region" : "ክልል"}
            {...register("region")}
          />
          <CInput
            label={lang === "en" ? "City" : "ከተማ"}
            {...register("city")}
          />
          <CInput
            label={lang === "en" ? "Telegram Number" : "የቴሌግራም ቁጥር"}
            {...register("phoneNumber")}
          />
          <CInput
            label={lang === "en" ? "Transaction number" : "የግብይት ቁጥር"}
            {...register("transactionNumber")}
          />
          <CInput
            label={
              lang === "en" ? "Total Transaction Amount" : "አጠቃላይ የግብይት መጠን"
            }
            {...register("transactionAmount")}
            endContent={<p className="">ETB</p>}
          />
          <CInput
            label={lang === "en" ? "Unit Price" : "ነጠላ ዋጋ"}
            {...register("price")}
            endContent={<p className="">ETB</p>}
            readOnly
          />
          <Button
            color="primary"
            type="submit"
            isLoading={isPending}
            className="self-center"
          >
            {lang === "en" ? "Sale" : "ሽጥ"}
          </Button>
        </div>
      </Form>
      {state?.status === false && state?.cause === "payed" && (
        <div className="w-fit mt-5 place-self-center grid gap-5 grid-cols-[1fr_auto] items-center">
          <p className="text-center text-danger-600 ">
            {lang === "en"
              ? "The user has already purchased the course"
              : "ተጠቃሚው ትምህርቱን አስቀድሞ ገዝቷል"}
          </p>
          <CButton
            onClick={async () => {
              const to = getValues("phoneNumber");
              await sendSMSToCustomer(
                to,
                decodeURIComponent(title).split("@")[0],
                decodeURIComponent(title).split("@")[1]
              )
                .then(() => {
                  toast.success("Successfully sent", {
                    description: `The message sent successfully to ${to}`,
                  });
                })
                .catch(() => {
                  toast.error("Failed sent", {
                    description: `The message failed to sent`,
                  });
                });
            }}
          >
            {lang === "en" ? "Send SMS" : "ኤስኤምኤስ ላክ"}
          </CButton>
        </div>
      )}
    </div>
  );
}