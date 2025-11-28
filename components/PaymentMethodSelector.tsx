"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useParams } from "next/navigation";
import React from "react";
import { usePaymentMethod } from "@/hooks/usePaymentMethod";
import { MapPin, Loader2 } from "lucide-react";

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onChapaSelect: () => void;
  onStripeSelect: () => void;
  title: string;
  price: number;
  birrPrice: number;
  dolarPrice: number;
  originalBirrPrice?: number;
  originalDolarPrice?: number;
}

export default function PaymentMethodSelector({
  isOpen,
  onOpenChange,
  onChapaSelect,
  onStripeSelect,
  title,
  birrPrice,
  dolarPrice,
  originalBirrPrice,
  originalDolarPrice,
}: PaymentMethodSelectorProps) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  // Use the smart payment method detection
  const { paymentMethod, country, loading, error } = usePaymentMethod();

  const handlePaymentSelect = () => {
    if (paymentMethod === "chapa") {
      onChapaSelect();
    } else {
      onStripeSelect();
    }
  };

  const getDisplayPrice = () => {
    if (paymentMethod === "chapa") {
      const hasDiscount = originalBirrPrice && originalBirrPrice > birrPrice;
      return {
        current: `${birrPrice} ETB`,
        original: hasDiscount ? `${originalBirrPrice} ETB` : null,
      };
    } else {
      const hasDiscount = originalDolarPrice && originalDolarPrice > dolarPrice;
      return {
        current: `$${dolarPrice} USD`,
        original: hasDiscount ? `$${originalDolarPrice} USD` : null,
      };
    }
  };

  const getPaymentMethodInfo = () => {
    if (paymentMethod === "chapa") {
      return {
        name: "Chapa",
        description:
          lang === "en" ? "Mobile & Bank Transfer" : "ሞባይል እና ባንክ ሽያጭ",
        icon: "C",
        color: "green",
        iconBg: "bg-green-100",
        textColor: "text-green-600",
      };
    } else {
      return {
        name: "Stripe",
        description:
          lang === "en" ? "Card & Digital Wallet" : "ካርድ እና ዲጂታል የሚያያዝ",
        icon: "S",
        color: "blue",
        iconBg: "bg-blue-100",
        textColor: "text-blue-600",
      };
    }
  };

  const paymentInfo = getPaymentMethodInfo();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      scrollBehavior="outside"
      placement="top-center"
      classNames={{ wrapper: "p-5" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {lang === "en" ? "Smart Payment" : "ዘመናዊ ክፍያ"}
            </ModalHeader>
            <div className="px-5">
              <p className="text-center text-lg font-semibold">{title}</p>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-600">
                  {lang === "en"
                    ? "Payment method automatically selected based on your location"
                    : "የክፍያ ዘዴ በአካባቢዎ ላይ በመመስረት በራስ-ሰር ይመርጣል"}
                </p>
              </div>
            </div>
            <ModalBody>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-gray-600">
                    {lang === "en"
                      ? "Detecting your location..."
                      : "አካባቢዎን እያወቅን..."}
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">
                    {lang === "en"
                      ? "Unable to detect location"
                      : "አካባቢን ማወቅ አልተቻለም"}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {lang === "en"
                      ? "We'll show you the default payment method."
                      : "የመሰረታዊ የክፍያ ዘዴ እናሳይዎታለን።"}
                  </p>
                  <Button
                    color="primary"
                    onPress={() => {
                      onChapaSelect();
                      onClose();
                    }}
                    className="w-full"
                  >
                    {lang === "en" ? "Continue with Chapa" : "በቻፓ ይቀጥሉ"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Location Info */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {lang === "en"
                        ? `Detected: ${country}`
                        : `ተገኝቷል: ${country}`}
                    </span>
                  </div>

                  {/* Auto-selected Payment Method */}
                  <div className="text-center text-sm text-gray-600 mb-4">
                    {lang === "en"
                      ? "Payment method automatically selected for your location:"
                      : "የክፍያ ዘዴ ለአካባቢዎ በራስ-ሰር ተመርጧል:"}
                  </div>

                  <Button
                    color="primary"
                    variant="bordered"
                    className="w-full h-auto min-h-16 flex items-center justify-between p-4"
                    onPress={() => {
                      handlePaymentSelect();
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${paymentInfo.iconBg} rounded-full flex items-center justify-center`}
                      >
                        <span
                          className={`${paymentInfo.textColor} font-bold text-sm`}
                        >
                          {paymentInfo.icon}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{paymentInfo.name}</div>
                        <div className="text-xs text-gray-500">
                          {paymentInfo.description}
                        </div>
                        <div className="mt-1">
                          {(() => {
                            const priceInfo = getDisplayPrice();
                            return (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-bold ${paymentInfo.textColor}`}
                                >
                                  {priceInfo.current}
                                </span>
                                {priceInfo.original && (
                                  <span className="text-xs text-default-400 line-through">
                                    {priceInfo.original}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className={paymentInfo.textColor}>→</div>
                  </Button>

                  {/* Additional Info */}
                  <div className="text-xs text-gray-500 text-center mt-4">
                    {paymentMethod === "chapa"
                      ? lang === "en"
                        ? "Secure mobile money payment via Chapa"
                        : "በቻፓ የሚሰራ ደህንነቱ የተጠበቀ ሞባይል ገንዘብ ክፍያ"
                      : lang === "en"
                      ? "Secure international payment via Stripe"
                      : "በስትራይፕ የሚሰራ ደህንነቱ የተጠበቀ ዓለም አቀፍ ክፍያ"}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose} variant="flat">
                {lang === "en" ? "Cancel" : "ይሰርዙ"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
