"use client";

import { getManager, registerManager } from "@/actions/manager/manager";
import { CInput, CSelect, CSelectItem } from "@/components/heroui";
import Loading from "@/components/loading";
import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import { TManager } from "@/lib/definations";
import { managerSchema } from "@/lib/zodSchema";
import { Button, Form } from "@heroui/react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

export default function Page() {
  const params = useParams<{ lang: string; id?: string[] }>();
  const lang = params?.lang || "en",
    id = params?.id,
    router = useRouter(),
    { handleSubmit, register, formState, setValue } = useForm<TManager>({
      resolver: zodResolver(managerSchema),
      defaultValues: {
        id: id?.[0] ?? "",
        firstName: "",
        fatherName: "",
        lastName: "",
        gender: "Female",
        age: "",
        country: "",
        region: "",
        city: "",
        phoneNumber: "",
        password: "",
      },
    }),
    { action, isPending } = useAction(registerManager, undefined, {
      onSuccess({ status }) {
        if (status) {
          router.push(`/${lang}/manager`);
        }
      },
    }),
    { loading } = useData({
      func: getManager,
      args: [id?.[0]],
      onSuccess(data) {
        setValue("firstName", data.firstName ?? "");
        setValue("fatherName", data.fatherName ?? "");
        setValue("lastName", data.lastName ?? "");
        setValue("gender", data.gender ?? "Female");
        setValue("age", `${data.age ?? ""}`);
        setValue("country", data.country ?? "");
        setValue("region", data.region ?? "");
        setValue("city", data.city ?? "");
        setValue("phoneNumber", data.phoneNumber ?? "");
      },
    });

  return loading ? (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  ) : (
    <div className="grid md:place-content-center overflow-auto">
      <Form
        onSubmit={handleSubmit(action)}
        validationErrors={Object.entries(formState.errors).reduce(
          (a, [key, value]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...a, [key]: (value as any).message };
          },
          {}
        )}
        className="p-4 md:p-10 bg-background rounded-xl shadow-md grid gap-5 grid-rows-[1fr_auto]"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <CInput
            {...register("firstName")}
            label={lang == "en" ? "First Name" : ""}
          />
          <CInput
            {...register("fatherName")}
            label={lang == "en" ? "Father Name" : ""}
          />
          <CInput
            {...register("lastName")}
            label={lang == "en" ? "Last Name" : ""}
          />
          <CSelect
            {...register("gender")}
            label={lang == "en" ? "Gender" : "ፆታ"}
          >
            {["Female", "Male"].map((v) => (
              <CSelectItem key={v}>{v}</CSelectItem>
            ))}
          </CSelect>
          <CInput {...register("age")} label={lang == "en" ? "Age" : "እድሜ"} />
          <CInput
            {...register("country")}
            label={lang == "en" ? "Country" : ""}
          />
          <CInput
            {...register("region")}
            label={lang == "en" ? "Region" : ""}
          />
          <CInput {...register("city")} label={lang == "en" ? "City" : ""} />
          <CInput
            {...register("phoneNumber")}
            label={lang == "en" ? "Phone Number" : "ስልክ ቁጥር"}
          />
          <CInput
            {...register("password")}
            label={lang == "en" ? "Password (optional)" : ""}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2 md:[&>*]:w-60=">
          <Button as={Link} href={`/${lang}/manager`} variant="flat">
            {lang == "en" ? "Back" : "ተመለስ"}
          </Button>
          <Button type="submit" color="primary" isLoading={isPending}>
            {lang == "en" ? "Register" : "መዝግብ"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
