"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAction from "@/hooks/useAction";
import { signupWithOTP } from "@/lib/action/user";
import { sendOTP } from "@/lib/action";
import CountrySelector from "@/components/CountrySelector";
import OTPInput from "@/components/OTPInput";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Loading from "@/components/loading";

// Ensure signup returns StateType:
// type StateType = { status: true; message: string } | { status: false; cause: string; message: string };
import { CButton } from "@/components/heroui";
import { Form, Input, Button, Progress } from "@heroui/react";

const formSchema = z.object({
  countryCode: z.string({ message: "" }).nonempty("Country code is required"),
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
    [selectedCountry, setSelectedCountry] = useState("+251"),
    [otp, setOtp] = useState(""),
    [isOtpSent, setIsOtpSent] = useState(false),
    [otpTimer, setOtpTimer] = useState(0),
    { handleSubmit, register, formState, setValue, watch } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        countryCode: "+251",
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
        error: lang == "en" ? "Failed to send OTP" : "OTP መላክ አልተሳካም",
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

  // Handle country selection
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setValue("countryCode", countryCode);
    
    // Reset phone number when country changes to avoid formatting issues
    let currentPhone = watch("phoneNumber");
    if (currentPhone) {
      // Remove all leading zeros for international format
      while (currentPhone.startsWith("0")) {
        currentPhone = currentPhone.substring(1);
      }
      setValue("phoneNumber", currentPhone);
    }
  };

  // Handle OTP change
  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
    setValue("otp", otpValue);
  };

  // Handle phone number change with universal formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow numbers
    value = value.replace(/\D/g, '');
    
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
    const countryCode = watch("countryCode");

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

    // Send OTP using backend
    otpAction({ phoneNumber: fullPhoneNumber });

    // Set UI state
    setIsOtpSent(true);
    setOtpTimer(60); // 60 seconds timer

    // Move to next step
    nextStep();
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
        countryCode: selectedCountry,
        phoneNumber,
        otp: "",
        password,
        confirmPassword,
      });
    }
  }, []);

  // Step titles
  const stepTitles = [
    lang == "en" ? "Phone Verification" : "የስልክ ማረጋገጫ",
    lang == "en" ? "OTP Verification" : "OTP ማረጋገጫ",
    lang == "en" ? "Set Password" : "የይለፍ ቃል ያዘጋጁ",
  ];

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // If authenticated, don't render signup form (will redirect)
  if (status === "authenticated") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loading />
      </div>
    );
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

        {/* Form Steps */}
        <Form
          onSubmit={handleSubmit(action)}
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
              <CountrySelector
                value={selectedCountry}
                onChange={handleCountryChange}
                placeholder={lang == "en" ? "Select Country" : "አገር ይምረጡ"}
                label={lang == "en" ? "Country" : "አገር"}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {lang == "en" ? "Phone Number" : "የስልክ ቁጥር"}
                </label>
                <div className="flex gap-2">
                  <div className="w-20">
                    <Input
                      color="primary"
                      value={selectedCountry}
                      readOnly
                      className="text-center font-semibold"
                      variant="bordered"
                    />
                  </div>
                  <Input
                    color="primary"
                    {...register("phoneNumber")}
                    onChange={handlePhoneNumberChange}
                    placeholder={
                      lang == "en" ? "9XXXXXXXX" : "9XXXXXXXX"
                    }
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
                  {selectedCountry}{watch("phoneNumber")}
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
                label=""
                length={6}
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
                  color="primary"
                  onPress={nextStep}
                  isDisabled={!validateStep(2)}
                  endContent={<ChevronRight size={16} />}
                  className="flex-1"
                >
                  {lang == "en" ? "Next" : "ቀጥል"}
                </CButton>
              </div>

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
