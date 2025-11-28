"use client";

import { CInput, CSelect, CSelectItem } from "@/components/heroui";
import useAction from "@/hooks/useAction";
import { sendOTP } from "@/lib/action";
import { affiliateRegistration } from "@/lib/action/course";
import { TAffiliateSelf } from "@/lib/definations";
import { cn } from "@/lib/utils";
import { affiliateSchemaSelf } from "@/lib/zodSchema";
import { Button, Form } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm, Controller } from "react-hook-form";

export default function Page() {
 const params = useParams<{ lang: string }>();
            const lang = params?.lang || "en",
    { handleSubmit, register, formState, control, setValue, watch, trigger } =
      useForm<TAffiliateSelf>({
        resolver: zodResolver(affiliateSchemaSelf),
        defaultValues: {
          firstName: "",
          fatherName: "",
          lastName: "",
          gender: "Female",
          age: "",
          country: "",
          region: "",
          city: "",
          idCard: "",
          phoneNumber: "",
          code: "",
          password: "",
        },
      }),
    router = useRouter(),
    { action, isPending } = useAction(affiliateRegistration, undefined, {
      success: "Successfully registered",
      error: "Failed to registered",
      onSuccess({ status }) {
        if (status) {
          router.push(`/${lang}/login`);
        }
      },
    }),
    { action: codeAction, isPending: codePending } = useAction(
      sendOTP,
      undefined,
      {
        success: lang == "en" ? "OTP sent successfully." : "OTP በተሳካ ሁኔታ ተልኳል",
      }
    );

  return (
    <div className="min-h-screen px-2 pt-20 pb-20 md:pb-4 grid md:items-center md:justify-center overflow-auto bg-gradient-to-br from-background via-background to-primary-50/30 dark:from-background dark:via-background dark:to-primary-950/20">
      {/* Background decorative elements */}
      <div className="fixed top-20 right-20 w-32 h-32 bg-primary-100/30 dark:bg-primary-900/20 rounded-full blur-3xl hidden md:block"></div>
      <div className="fixed bottom-20 left-20 w-40 h-40 bg-success-100/30 dark:bg-success-900/20 rounded-full blur-3xl hidden md:block"></div>
      
      <Form
        onSubmit={handleSubmit(action)}
        validationErrors={Object.entries(formState.errors).reduce(
          (a, [key, value]) => {
            return { ...a, [key]: value.message };
          },
          {}
        )}
        className="relative z-10 p-6 md:p-8 bg-background/80 dark:bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl dark:shadow-primary-900/20 border border-divider dark:border-white/10"
      >
        <div className="w-full pb-6 text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-foreground dark:text-white bg-gradient-to-r from-primary-600 via-primary-700 to-success-600 dark:from-primary-400 dark:via-primary-300 dark:to-success-400 bg-clip-text text-transparent">
            {lang == "en" ? "Affiliate Registration" : "የተባባሪ ምዝገባ"}
          </h1>
          <p className="text-sm text-foreground/70 dark:text-foreground/60">
            {lang == "en" ? "Join our affiliate program and start earning" : "የተባባሪ ፕሮግራማችን ይቀላቀሉ እና ገቢ ያግኙ"}
          </p>
        </div>
        <div className="w-full grid gap-2 md:grid-cols-[1fr_3fr] ">
          <Controller
            control={control}
            name="idCard"
            render={({ field: { value, name }, fieldState }) => (
              <label
                className={cn(
                  "md:w-56 aspect-square md:place-self-center grid grid-rows-[1fr_auto]   "
                )}
              >
                <input
                  type="file"
                  accept="image/png,jpg,jpeg"
                  className="hidden"
                  onChange={async ({ target }) => {
                    if (target.files?.[0]) {
                      setValue(
                        name,
                        Buffer.from(
                          await target.files[0].arrayBuffer()
                        ).toString("base64"),
                        { shouldValidate: true }
                      );
                    } else {
                      setValue(name, "", { shouldValidate: true });
                    }
                  }}
                />
                {value ? (
                  <Image
                    src={
                      value
                        ? `data:image/png;base64,${value}`
                        : "/darulkubra.png"
                    }
                    alt=""
                    height={1000}
                    width={1000}
                    className={cn(
                      "size-full overflow-hidden object-contain rounded-xl bg-primary-50 dark:bg-primary-950/30 border-2 border-primary-200 dark:border-primary-800/50 shadow-lg dark:shadow-primary-900/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed grid place-content-center transition-all duration-300 hover:shadow-lg cursor-pointer",
                      fieldState.invalid || fieldState.error
                        ? "bg-danger-50 dark:bg-danger-950/30 border-danger-300 dark:border-danger-800/50 hover:bg-danger-100 dark:hover:bg-danger-950/50"
                        : "bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-950/50"
                    )}
                  >
                    <div className="text-center space-y-2 p-4">
                      <svg className="w-12 h-12 mx-auto text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-semibold text-foreground dark:text-foreground/80">
                        {lang == "en" ? "Upload ID card" : "መታወቂያ ካርድ ይጫኑ"}
                      </p>
                      <p className="text-xs text-foreground/60 dark:text-foreground/50">
                        {lang == "en" ? "Click to browse" : "ለመምረጥ ይጫኑ"}
                      </p>
                    </div>
                  </div>
                )}
                {(fieldState.invalid || fieldState.error) && (
                  <p className={cn("pt-1 text-xs text-center text-danger")}>
                    {fieldState.error?.message || ""}
                  </p>
                )}
              </label>
            )}
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <CInput
              {...register("firstName")}
              label={lang == "en" ? "First Name" : "የመጀመሪያ ስም"}
              autoFocus
            />
            <CInput
              {...register("fatherName")}
              label={lang == "en" ? "Father Name" : "የአባት ስም"}
            />
            <CInput
              {...register("lastName")}
              label={lang == "en" ? "Last Name" : "የአያት ስም"}
            />
            <CInput
              {...register("country")}
              label={lang == "en" ? "Country" : "ሀገር"}
            />
            <CInput
              {...register("region")}
              label={lang == "en" ? "Region" : "ክልል"}
            />
            <CInput
              {...register("city")}
              label={lang == "en" ? "City" : "ከተማ"}
            />
            <CSelect
              {...register("gender")}
              label={lang == "en" ? "Gender" : "ፆታ"}
            >
              {["Female", "Male"].map((v) => (
                <CSelectItem key={v} textValue={v}>{v}</CSelectItem>
              ))}
            </CSelect>
            <CInput {...register("age")} label={lang == "en" ? "Age" : "እድሜ"} />
            <div className="grid grid-cols-[1fr_auto]">
              <CInput
                {...register("phoneNumber")}
                label={lang == "en" ? "Phone Number" : "ስልክ ቁጥር"}
                classNames={{
                  base: "min-w-40-",
                  inputWrapper: "rounded-r-none",
                }}
              />
              <Button
                color="primary"
                type="button"
                isLoading={codePending}
                onPress={() =>
                  ((phoneNumber) => {
                    if (phoneNumber) {
                      codeAction({ phoneNumber });
                    }
                    trigger("phoneNumber");
                  })(watch("phoneNumber"))
                }
                className="h-full rounded-l-none bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-lg dark:shadow-primary-900/50 font-bold"
              >
                {lang == "en" ? "code" : "ኮድ"}
              </Button>
            </div>
            <CInput
              {...register("password")}
              label={lang == "en" ? "Password" : "የይለፍ ቃል"}
              type="password"
            />
            <CInput
              {...register("code")}
              label={lang == "en" ? "Code" : "ኮድ"}
            />
            <Button 
              type="submit" 
              color="primary" 
              isLoading={isPending}
              className="md:col-span-2 xl:col-span-3 h-12 bg-gradient-to-r from-primary-500 via-primary-600 to-success-500 dark:from-primary-600 dark:via-primary-700 dark:to-success-600 hover:from-primary-600 hover:via-primary-700 hover:to-success-600 dark:hover:from-primary-700 dark:hover:via-primary-800 dark:hover:to-success-700 text-white font-bold shadow-xl hover:shadow-2xl dark:shadow-primary-900/50 transition-all duration-300 hover:scale-[1.02]"
            >
              {lang == "en" ? "Register" : "ተመዝገብ"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
