"use client";

import React from "react";
import { Form, Button, SelectItem } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { sellerSchema } from "@/lib/zodSchema";
import { TSeller } from "@/lib/definations";
import { getSeller, registerSeller } from "@/actions/manager/seller";
import { ChevronLeft } from "lucide-react";
import { CInput, CSelect, CSelectItem } from "@/components/heroui";

export default function Page() {
  const params= useParams<{ lang: string ,id?:string[]}>();
        const lang = params?.lang || "en",
        id = params?.id,
    router = useRouter(),
    { handleSubmit, register, setValue, formState } = useForm<TSeller>({
      resolver: zodResolver(sellerSchema),
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
    { action, isPending } = useAction(registerSeller, undefined, {
      loading: lang == "en" ? "registering" : "በመመዝገብ ላይ",
      success: lang == "en" ? "Successfully registered" : "በተሳካ ሁኔታ ተመዝግቧል",
      error: lang == "en" ? "Failed to register" : "መመዝገብመመዝገብ አልተሳካም",
      onSuccess({ status }) {
        if (status) {
          router.push(`/${lang}/seller`);
        }
      },
    }),
    { loading } = useData({
      func: getSeller, // Corrected function
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

  // console.log(formState.errors);

  // Loading is handled by TopLoadingBar in layout
  if (loading) return null;

  return (
    <div className="grid md:place-content-center overflow-auto">
      <Form
        className="w-full max-w-md p-4 md:p-8 bg-background/50 rounded-lg shadow-md grid gap-10"
        validationErrors={Object.entries(formState.errors).reduce(
          (a, [key, { message }]) => ({ ...a, [key]: message }),
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
            href={`/${lang}/seller`}
          >
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-bold text-center">
            {lang == "en" ? "Seller Registration" : "ተባባሪ ምዝገባ"}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-4">
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
              label={lang == "en" ? "CLastCInput Name" : "የአያት ስም"}
            />
            <CInput {...register("age")} label={lang == "en" ? "Age" : "እድሜ"} />
            <CSelect
              {...register("gender")}
              label={lang == "en" ? "Gender" : "ፆታ"}
            >
              <CSelectItem key="Female" textValue={lang == "en" ? "Female" : "ሴት"}>
                {lang == "en" ? "Female" : "ሴት"}
              </CSelectItem>
              <SelectItem key="Male" textValue={lang == "en" ? "Male" : "ወንድ"}>
                {lang == "en" ? "Male" : "ወንድ"}
              </SelectItem>
            </CSelect>
          </div>
          <div className="grid gap-4">
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
          <Button
            type="submit"
            color="primary"
            className=""
            isLoading={isPending}
          >
            {lang == "en" ? "register" : "መዝግብ"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
