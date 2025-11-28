"use client";

import { pay } from "@/lib/action/chapa";
import { payWithStripe } from "@/lib/action/stripe";
import { getCurrentUserPhoneNumber } from "@/lib/action";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import useAction from "@/hooks/useAction";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import PaymentMethodSelector from "./PaymentMethodSelector";
import StripeCheckout from "./StripeCheckout";

export default function Payment({
  isOpen,
  id,
  onOpenChange,
  affiliateCode,
  title,
  price,
  birrPrice,
  dolarPrice,
  originalBirrPrice,
  originalDolarPrice,
}: {
  isOpen: boolean;
  id: string;
  onOpenChange: () => void;
  affiliateCode?: string;
  title: string;
  price: number;
  birrPrice: number;
  dolarPrice: number;
  originalBirrPrice?: number;
  originalDolarPrice?: number;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<
    "chapa" | "stripe" | null
  >(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("");
  const [, setIsLoadingUser] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const formSchema = z.object({
    id: z.string({ message: "" }).nonempty("ID is required"),
    phoneNumber: z
      .string({ message: "" })
      .min(9, "Must be at least 9 digits")
      .max(20, "Must be at most 20 digits")
      .regex(/^\+?\d+$/, "Must contain only digits with optional + prefix"),
    affiliateCode: z.string({ message: "" }).optional(),
  });

  const { handleSubmit, register, reset, formState, setValue } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      phoneNumber: "",
      affiliateCode,
    },
  });

  const { action: chapaAction, isPending: chapaPending } = useAction(
    pay,
    undefined,
    {
      loading: lang == "en" ? "initializing Payment" : "ክፍያን ማስጀመር",
      success: lang == "en" ? "Payment starting completed" : "ክፍያ መጀመሩ ተጠናቀቀ",
      error: lang == "en" ? "Failed to initiate payment" : "ክፍያ ማስጀመር አልተሳካም",
      onSuccess(state) {
        if (state.status) {
          router.push(state.url);
        } else {
          onOpenChange();
        }
      },
    }
  );

  const { action: stripeAction, isPending: stripePending } = useAction(
    payWithStripe,
    undefined,
    {
      loading: lang == "en" ? "initializing Payment" : "ክፍያን ማስጀመር",
      success: lang == "en" ? "Payment starting completed" : "ክፍያ መጀመሩ ተጠናቀቀ",
      error: lang == "en" ? "Failed to initiate payment" : "ክፍያ ማስጀመር አልተሳካም",
      onSuccess(state) {
        if (state.status) {
          router.push(state.url);
        } else {
          onOpenChange();
        }
      },
    }
  );

  const router = useRouter();

  // Fetch user phone number when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserPhoneNumber();
      reset();
      setShowMethodSelector(true);
      setShowPaymentForm(false);
      setShowStripeCheckout(false);
      setSelectedMethod(null);
    }
  }, [isOpen, reset]);

  const fetchUserPhoneNumber = async () => {
    setIsLoadingUser(true);
    setAuthError("");
    try {
      const result = await getCurrentUserPhoneNumber();
      if (result.status && result.phoneNumber) {
        setUserPhoneNumber(result.phoneNumber);
        setValue("phoneNumber", result.phoneNumber);

        // Check if course is free (all prices are 0)
        const isFree = birrPrice === 0 && dolarPrice === 0;
        if (isFree) {
          // Directly enroll user in free course
          await handleFreeEnrollment();
        }
      } else {
        setAuthError(
          lang === "en"
            ? "Please login to purchase courses"
            : "እባክዎ ኮርሶችን ለመግዛት ይግቡ"
        );
      }
    } catch (error) {
      console.error("Error fetching user phone number:", error);
      setAuthError(
        lang === "en"
          ? "Failed to get user information"
          : "የተጠቃሚ መረጃ ማግኘት አልተሳካም"
      );
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleFreeEnrollment = async () => {
    try {
      // Create a free enrollment by calling the payment verification API with a mock transaction
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: id,
          phoneNumber: userPhoneNumber,
          affiliateCode: affiliateCode || undefined,
          amount: 0,
          currency: "FREE",
          status: "success",
          tx_ref: `free_${Date.now()}_${id}`,
        }),
      });

      if (response.ok) {
        onOpenChange(); // Close modal
        router.push(`/${lang}/mycourse/${id}`);
      } else {
        throw new Error("Failed to enroll in free course");
      }
    } catch (error) {
      console.error("Error enrolling in free course:", error);
      setAuthError(
        lang === "en"
          ? "Failed to enroll in free course"
          : "በነፃ ኮርስ ውስጥ መመዝገብ አልተሳካም"
      );
    }
  };

  const handleChapaSelect = () => {
    if (!userPhoneNumber) {
      setAuthError(
        lang === "en"
          ? "Please login to purchase courses"
          : "እባክዎ ኮርሶችን ለመግዛት ይግቡ"
      );
      return;
    }
    setSelectedMethod("chapa");
    setShowMethodSelector(false);
    setShowPaymentForm(true);
  };

  const handleStripeSelect = () => {
    if (!userPhoneNumber) {
      setAuthError(
        lang === "en"
          ? "Please login to purchase courses"
          : "እባክዎ ኮርሶችን ለመግዛት ይግቡ"
      );
      return;
    }
    setSelectedMethod("stripe");
    setShowMethodSelector(false);
    setShowStripeCheckout(true);
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedMethod === "chapa") {
      chapaAction(data);
    } else if (selectedMethod === "stripe") {
      stripeAction({ ...data, lang });
    }
  };

  const isPending = chapaPending || stripePending;

  // Check if course is free
  const isFree = price === 0 && birrPrice === 0 && dolarPrice === 0;

  return (
    <>
      {/* Free Course Enrollment Modal */}
      {isFree && (
        <Modal isOpen={isOpen} onClose={onOpenChange} placement="top-center">
          <ModalContent>
            <ModalHeader>
              {lang === "en" ? "Free Course" : "ነፃ ኮርስ"}
            </ModalHeader>
            <ModalBody>
              <p className="text-center text-lg font-semibold text-green-600">
                {lang === "en" ? "This course is free!" : "ይህ ኮርስ ነፃ ነው!"}
              </p>
              <p className="text-center">
                {lang === "en"
                  ? "Click below to start learning immediately."
                  : "ወዲያውኑ መማር ለመጀመር ከታች ይጫኑ።"}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onOpenChange}>
                {lang === "en" ? "Cancel" : "ተወው"}
              </Button>
              <Button
                color="success"
                onPress={() => {
                  if (userPhoneNumber) {
                    handleFreeEnrollment();
                  } else {
                    router.push(`/${lang}/login`);
                  }
                }}
              >
                {lang === "en" ? "Start Learning" : "መማር ይጀምሩ"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Payment Method Selector - Only show for paid courses */}
      {!isFree && (
        <PaymentMethodSelector
          isOpen={showMethodSelector}
          onOpenChange={() => {
            setShowMethodSelector(false);
            onOpenChange();
          }}
          onChapaSelect={handleChapaSelect}
          onStripeSelect={handleStripeSelect}
          title={title}
          price={price}
          birrPrice={birrPrice}
          dolarPrice={dolarPrice}
          originalBirrPrice={originalBirrPrice}
          originalDolarPrice={originalDolarPrice}
        />
      )}

      {/* Auth Error Message */}
      {authError && (
        <Modal
          isOpen={!!authError}
          onClose={() => setAuthError("")}
          placement="top-center"
        >
          <ModalContent>
            <ModalHeader>
              {lang === "en" ? "Authentication Required" : "ማረጋገጥ ያስፈልጋል"}
            </ModalHeader>
            <ModalBody>
              <p className="text-red-600">{authError}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                onPress={() => {
                  setAuthError("");
                  router.push(`/${lang}/login`);
                }}
              >
                {lang === "en" ? "Go to Login" : "ወደ መግቢያ ይሂዱ"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Payment Form */}
      <Modal
        isOpen={showPaymentForm}
        onOpenChange={() => {
          setShowPaymentForm(false);
          setShowMethodSelector(true);
        }}
        scrollBehavior="outside"
        placement="top-center"
        classNames={{ wrapper: "p-5" }}
      >
        <Form
          onSubmit={handleSubmit(handleFormSubmit)}
          validationErrors={Object.entries(formState.errors).reduce(
            (a, [key, value]) => ({ ...a, [key]: value.message }),
            {}
          )}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader>
                  {lang === "en" ? "Course Payment" : "የትምህርት ክፍያ"} -{" "}
                  {selectedMethod === "chapa" ? "Chapa" : "Stripe"}
                </ModalHeader>
                <div className="px-5">
                  <p className="text-center">{title}</p>
                  <div className="text-center">
                    {selectedMethod === "chapa" ? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-2xl font-bold text-primary">
                          {birrPrice.toFixed(2)} ETB
                        </p>
                        {originalBirrPrice && originalBirrPrice > birrPrice && (
                          <p className="text-lg text-default-400 line-through">
                            {originalBirrPrice.toFixed(2)} ETB
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-2xl font-bold text-primary">
                          ${dolarPrice.toFixed(2)} USD
                        </p>
                        {originalDolarPrice &&
                          originalDolarPrice > dolarPrice && (
                            <p className="text-lg text-default-400 line-through">
                              ${originalDolarPrice.toFixed(2)} USD
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <ModalBody>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      {lang === "en" ? "Phone Number" : "የስልክ ቁጥር"}
                    </p>
                    <p className="text-lg font-semibold">{userPhoneNumber}</p>
                  </div>
                  <Input
                    {...register("phoneNumber")}
                    color="primary"
                    placeholder={lang == "en" ? "Phone Number" : "የስልክ ቁጥር"}
                    value={userPhoneNumber}
                    isReadOnly
                    isDisabled
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onPress={() => {
                      setShowPaymentForm(false);
                      setShowMethodSelector(true);
                    }}
                    variant="flat"
                    className=""
                  >
                    {lang == "en" ? "Back" : "ይመለሱ"}
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={isPending}
                    className={""}
                  >
                    {lang == "en"
                      ? "Pay with " +
                        (selectedMethod === "chapa" ? "Chapa" : "Stripe")
                      : selectedMethod === "chapa"
                      ? "በቻፓ ይክፈሉ"
                      : "በስትራይፕ ይክፈሉ"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </Modal>

      <StripeCheckout
        isOpen={showStripeCheckout}
        onOpenChange={() => setShowStripeCheckout(false)}
        courseId={id}
        courseTitle={title}
        coursePrice={price}
        birrPrice={birrPrice}
        dolarPrice={dolarPrice}
        lang={lang}
        userPhoneNumber={userPhoneNumber}
      />
    </>
  );
}
