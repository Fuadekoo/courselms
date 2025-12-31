"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAction from "@/hooks/useAction";
import { signupWithOTP } from "@/lib/action/user";
import { sendOTP } from "@/lib/action";
import OTPInput from "@/components/OTPInput";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// Ensure signup returns StateType:
// type StateType = { status: true; message: string } | { status: false; cause: string; message: string };
import { CButton } from "@/components/heroui";
import { Form, Input, Button, Progress } from "@heroui/react";

const formSchema = z.object({
  phoneNumber: z.string({ message: "" }).nonempty("Phone number is required"),
  otp: z
    .string({ message: "" })
    .nonempty("OTP is required")
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
  password: z.string({ message: "" }).nonempty("Password is required"),
  confirmPassword: z
    .string({ message: "" })
    .nonempty("confirm password  is matched"),
});

export default function Page() {
  const params = useParams<{ lang: string }>(),
    lang = params?.lang ?? "en",
    searchParams = useSearchParams(),
    router = useRouter(),
    { data: session, status } = useSession(),
    [currentStep, setCurrentStep] = useState(1),
    [otp, setOtp] = useState(""),
    [isOtpSent, setIsOtpSent] = useState(false),
    [otpTimer, setOtpTimer] = useState(0),
    { handleSubmit, register, formState, setValue, watch } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        phoneNumber: "",
        otp: "",
        password: "",
        confirmPassword: "",
      },
    }),
    { action, isPending } = useAction(signupWithOTP, undefined, {
      onSuccess(state) {
        // Handle client-side redirect after successful signup
        if (state.status && state.redirect) {
          window.location.href = state.redirect;
        }
      },
      success: lang == "en" ? "Successfully registered" : "በተሳካ ሁኔታ ተመዝግበዋል",
      error: lang == "en" ? "Registration failed" : "መመዝገብ አልተሳካም",
    }),
    { action: otpAction, isPending: otpPending } = useAction(
      sendOTP,
      undefined,
      {
        success: lang == "en" ? "OTP sent successfully!" : "OTP በተሳካ ሁኔታ ተልኳል!",
        onSuccess: () => {
          // Set UI state and move to next step on successful OTP
          setIsOtpSent(true);
          setOtpTimer(60); // 60 seconds timer
          nextStep();
        },
        onError: ({ cause, message }) => {
          if (cause === "phone_already_registered") {
            toast.error(
              lang === "en"
                ? "This phone number is already registered. Please sign in instead."
                : "ይህ ስልክ ቁጥር አስቀድሞ ተመዝግቧል። እባክዎ ይግቡ።"
            );
            return;
          }

          toast.error(
            message ||
              (lang === "en" ? "Failed to send OTP" : "OTP መላክ አልተሳካም")
          );
        },
      }
    );

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      let redirectPath = `/${lang}`;

      if (role === "instructor") {
        redirectPath = `/${lang}/dashboard`;
      } else if (role === "manager") {
        redirectPath = `/${lang}/manager`;
      } else if (role === "student") {
        redirectPath = `/${lang}/course`;
      }

      router.replace(redirectPath);
    }
  }, [status, session, router, lang]);

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handle OTP change
  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
    setValue("otp", otpValue);
  };

  // Handle phone number change with universal formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Only allow numbers
    value = value.replace(/\D/g, "");

    // Remove all leading zeros (handles multiple 0s like 00, 000, etc.)
    // This is standard practice for international format
    // 0912345678 → 912345678 → +251912345678
    // 00912345678 → 912345678 → +251912345678
    while (value.startsWith("0")) {
      value = value.substring(1);
    }

    setValue("phoneNumber", value);
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle Get OTP
  const handleGetOtp = () => {
    let phoneNumber = watch("phoneNumber");
    const countryCode = "+251"; // Fixed to Ethiopia

    if (!phoneNumber) {
      alert(
        lang === "en" ? "Please enter phone number first" : "እባክዎ የስልክ ቁጥር ያስገቡ"
      );
      return;
    }

    // Remove all leading zeros (universal international format)
    while (phoneNumber.startsWith("0")) {
      phoneNumber = phoneNumber.substring(1);
    }

    // Update the form value to reflect the cleaned number
    setValue("phoneNumber", phoneNumber);

    // Combine country code with phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // Send phone OTP
    otpAction({ phoneNumber: fullPhoneNumber });
  };

  // Handle step validation
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        const phoneNumber = watch("phoneNumber");
        return phoneNumber && phoneNumber.length > 0;
      case 2:
        return isOtpSent && otp.length === 6;
      case 3:
        const password = watch("password");
        const confirmPassword = watch("confirmPassword");
        return password && confirmPassword && password === confirmPassword;
      default:
        return false;
    }
  };

  useEffect(() => {
    const phoneNumber = searchParams?.get("u"),
      password = searchParams?.get("p"),
      confirmPassword = searchParams?.get("cp");
    if (phoneNumber && password && confirmPassword) {
      action({
        countryCode: "+251",
        phoneNumber,
        otp: "",
        password,
        confirmPassword,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step titles
  const stepTitles = [
    lang == "en" ? "Phone Verification" : "የስልክ ማረጋገጫ",
    lang == "en" ? "OTP Verification" : "OTP ማረጋገጫ",
    lang == "en" ? "Set Password" : "የይለፍ ቃል ያዘጋጁ",
  ];

  // Loading is handled by TopLoadingBar in layout
  if (status === "loading" || status === "authenticated") {
    return null;
  }

  return (
    <div className="h-dvh p-4 grid content-center md:justify-center">
      <div className="w-full md:w-96 py-10 px-5 md:px-10 bg-background shadow shadow-primary-200 rounded-xl">
        {/* Header */}
        <div className="grid place-content-center mb-6">
          <Logo />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          {lang == "en" ? "Student Registration" : "የተማሪ መመዝገቢያ"}
        </h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {lang == "en" ? "Step" : "ደረጃ"} {currentStep}{" "}
              {lang == "en" ? "of" : "ከ"} 3
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <Progress
            value={(currentStep / 3) * 100}
            className="w-full"
            color="primary"
            size="sm"
          />
          <p className="text-center text-sm font-medium text-primary mt-2">
            {stepTitles[currentStep - 1]}
          </p>
        </div>

        {/* Google Sign In Option */}
        <div className="mb-6">
          <CButton
            type="button"
            color="default"
            size="lg"
            variant="bordered"
            className="w-full font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            onPress={() => {
              signIn("google", {
                callbackUrl: `/${lang}/course`,
              });
            }}
            startContent={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            {lang == "en" ? "Sign up with Google" : "በ Google ይመዝገቡ"}
          </CButton>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-gray-500 dark:text-gray-400">
                {lang == "en" ? "OR" : "ወይም"}
              </span>
            </div>
          </div>
        </div>

        {/* Form Steps */}
        <Form
          onSubmit={handleSubmit((data) => {
            action({
              ...data,
              countryCode: "+251",
            });
          })}
          validationErrors={Object.entries(formState.errors).reduce(
            (a, [key, { message }]) => {
              return { ...a, [key]: message };
            },
            {}
          )}
          className="grid gap-6"
        >
          {/* Step 1: Phone Number */}
          {currentStep === 1 && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {lang == "en" ? "Phone Number" : "የስልክ ቁጥር"}
                </label>
                <div className="flex gap-2">
                  <div className="w-20">
                    <Input
                      color="primary"
                      value="+251"
                      readOnly
                      className="text-center font-semibold"
                      variant="bordered"
                    />
                  </div>
                  <Input
                    color="primary"
                    {...register("phoneNumber")}
                    onChange={handlePhoneNumberChange}
                    placeholder={lang == "en" ? "9XXXXXXXX" : "9XXXXXXXX"}
                    className="flex-1"
                    variant="bordered"
                    description={
                      lang == "en"
                        ? "Leading 0 will be auto-removed (0912345678 → 912345678)"
                        : "መነሻ 0 በራስ-ሰር ይወገዳል (0912345678 → 912345678)"
                    }
                  />
                </div>
              </div>

              <CButton
                color="primary"
                onPress={handleGetOtp}
                isLoading={otpPending}
                isDisabled={!validateStep(1)}
                className="mt-4"
              >
                {lang == "en" ? "Get OTP" : "OTP ያግኙ"}
              </CButton>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div className="grid gap-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {lang == "en"
                    ? "We sent a 6-digit code to your phone"
                    : "6-ዲጂት ኮድ ወደ ስልክዎ ላክን"}
                </p>
                <p className="text-xs text-gray-500 font-semibold">
                  +251{watch("phoneNumber")}
                </p>
              </div>

              <OTPInput
                value={otp}
                onChange={handleOtpChange}
                onComplete={handleOtpChange}
                disabled={!isOtpSent}
                placeholder={
                  lang == "en" ? "Enter 6-digit OTP" : "6-ዲጂት OTP ያስገቡ"
                }
                label={lang == "en" ? "Phone OTP" : "የስልክ OTP"}
                length={6}
              />

              {otpTimer > 0 && (
                <div className="text-center">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={handleGetOtp}
                    isDisabled={otpTimer > 0}
                    isLoading={otpPending}
                    className="text-xs"
                  >
                    {lang == "en" ? "Resend OTP" : "OTP እንደገና ላክ"} ({otpTimer}s)
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <CButton
                  color="default"
                  variant="bordered"
                  onPress={prevStep}
                  startContent={<ChevronLeft size={16} />}
                  className="flex-1"
                >
                  {lang == "en" ? "Back" : "ተመለስ"}
                </CButton>
                <CButton
                  color="primary"
                  onPress={nextStep}
                  isDisabled={!validateStep(2)}
                  endContent={<ChevronRight size={16} />}
                  className="flex-1"
                >
                  {lang == "en" ? "Next" : "ቀጥል"}
                </CButton>
              </div>
            </div>
          )}

          {/* Step 3: Password Setup */}
          {currentStep === 3 && (
            <div className="grid gap-4">
              <Input
                color="primary"
                {...register("password")}
                type="password"
                placeholder={lang == "en" ? "Password" : "የይለፍ ቃል"}
                variant="bordered"
                label={lang == "en" ? "New Password" : "አዲስ የይለፍ ቃል"}
              />

              <Input
                color="primary"
                {...register("confirmPassword")}
                type="password"
                placeholder={
                  lang == "en" ? "Confirm Password" : "የይለፍ ቃል አረጋግጥ"
                }
                variant="bordered"
                label={lang == "en" ? "Confirm Password" : "የይለፍ ቃል አረጋግጥ"}
              />

              <div className="flex gap-3">
                <CButton
                  color="default"
                  variant="bordered"
                  onPress={prevStep}
                  startContent={<ChevronLeft size={16} />}
                  className="flex-1"
                >
                  {lang == "en" ? "Back" : "ተመለስ"}
                </CButton>
                <CButton
                  type="submit"
                  color="primary"
                  isLoading={isPending}
                  isDisabled={!validateStep(3)}
                  className="flex-1"
                >
                  {lang == "en" ? "Sign up" : "ይመዝገቡ"}
                </CButton>
              </div>
            </div>
          )}
        </Form>

        {/* Login Link */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {lang == "en" ? (
              <>
                If you have an account, please{" "}
                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/login`)}
                  className="text-primary hover:underline font-medium"
                >
                  login
                </button>
              </>
            ) : (
              <>
                መለያ ካላችሁ{" "}
                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/login`)}
                  className="text-primary hover:underline font-medium"
                >
                  ይግቡ
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
