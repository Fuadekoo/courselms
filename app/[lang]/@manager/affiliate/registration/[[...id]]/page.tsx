"use client";

import React from "react";
import { Button, Form, SelectItem } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import Loading from "@/components/loading";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAffiliate, registerAffiliate } from "@/actions/manager/affiliate";
import { affiliateSchema } from "@/lib/zodSchema";
import { TAffiliate } from "@/lib/definations";
import { CInput, CSelect, CSelectItem } from "@/components/heroui";
import { ChevronLeft } from "lucide-react";

export default function Page() {
  const params= useParams<{ lang: string ,id?:string[]}>();
    const lang = params?.lang || "en",
    id = params?.id,
    router = useRouter(),
    { handleSubmit, register, setValue, formState } = useForm<TAffiliate>({
      resolver: zodResolver(affiliateSchema),
      defaultValues: {
        id: id?.[0],
        firstName: "",
        fatherName: "",
        lastName: "",
        age: "",
        gender: "Female",
        phoneNumber: "",
        country: "",
        region: "",
        city: "",
        password: "",
      },
    }),
    { action, isPending } = useAction(registerAffiliate, undefined, {
      loading: lang == "en" ? "registering" : "በመመዝገብ ላይ",
      success: lang == "en" ? "Successfully registered" : "በተሳካ ሁኔታ ተመዝግቧል",
      error: lang == "en" ? "Failed to register" : "መመዝገብመመዝገብ አልተሳካም",
      onSuccess({ status }) {
        if (status) {
          router.push(`/${lang}/affiliate`);
        }
      },
    }),
    { loading } = useData({
      func: getAffiliate, // Corrected function
      args: [id?.[0] || "none"],
      onSuccess(data) {
        setValue("firstName", data.firstName);
        setValue("fatherName", data.fatherName);
        setValue("lastName", data.lastName);
        setValue("age", `${data.age ?? ""}`);
        setValue("gender", data.gender || "Female");
        setValue("phoneNumber", data.phoneNumber);
        setValue("country", data.country);
        setValue("region", data.region);
        setValue("city", data.city);
      },
    });

  return loading ? (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  ) : (
    <div className="grid md:place-content-center overflow-auto">
      <Form
        className="w-full max-w-md p-8 bg-background/20 rounded-xl shadow-md grid gap-10"
        validationErrors={Object.entries(formState.errors).reduce(
          (a, [key, value]) => ({ ...a, [key]: value.message }),
          {}
        )}
        onSubmit={handleSubmit(action)}
      >
        <div className="grid gap-2 grid-cols-[auto_1fr]">
          <Button
            isIconOnly
            color="primary"
            variant="flat"
            as={Link}
            href={`/${lang}/affiliate`}
          >
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-bold text-center">
            {lang == "en" ? "Affiliate Registration" : "ተባባሪ ምዝገባ"}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 ">
          <div className="grid gap-4 ">
            <CInput
              {...register("firstName")}
              label={lang == "en" ? "First Name" : "ስም"}
            />
            <CInput
              {...register("fatherName")}
              label={lang == "en" ? "Father Name" : "የአባት ስም"}
            />
            <CInput
              {...register("lastName")}
              label={lang == "en" ? "Last Name" : "የአያት ስም"}
            />
            <CInput {...register("age")} label={lang == "en" ? "Age" : "እድሜ"} />
            <CSelect
              {...register("gender")}
              label={lang == "en" ? "Gender" : "ፆታ"}
            >
              <CSelectItem key="Female">
                {lang == "en" ? "Female" : "ሴት"}
              </CSelectItem>
              <SelectItem key="Male">
                {lang == "en" ? "Male" : "ወንድ"}
              </SelectItem>
            </CSelect>
          </div>
          <div className="grid gap-4 ">
            <CInput
              {...register("phoneNumber")}
              label={lang == "en" ? "Phone Number" : "ስልክ ቁጥር"}
            />
            <CInput
              {...register("country")}
              label={lang == "en" ? "Country" : "አገር"}
            />
            <CInput
              {...register("region")}
              label={lang == "en" ? "Region" : "ክልል"}
            />
            <CInput
              {...register("city")}
              label={lang == "en" ? "City" : "ከተማ"}
            />
            <CInput
              {...register("password")}
              label={lang == "en" ? "Password" : "ሚስጥር ቁጥር"}
            />
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 ">
          <Button type="submit" color="primary" isLoading={isPending}>
            {lang == "en" ? "register" : "መዝግብ"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
