/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Trophy,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useEffect } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Button } from "@heroui/react";
import { getCertificateDetails } from "@/actions/student/mycourse";
import useData from "@/hooks/useData";
import { useGlobalLoading } from "@/stores/uiStore";

type CertificateData = {
  status: boolean;
  courseTitle: string;
  studentName: string;
  percent: number;
  result: "poor" | "good" | "veryGood" | "excellent" | string;
  instructorName?: string | null;
  issuedAt: string;
  qrcode?: string;
};

function EnglishCertification({
  data,
  lang,
  courseId,
}: {
  data: CertificateData;
  lang: string;
  courseId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const issued = new Date(data.issuedAt);
  const issuedStr = issued.toLocaleDateString();
  const result = String(data.result || "").toLowerCase();

  // Use full URL from data (server returns full URL with userId)
  const qrPath =
    data.qrcode ||
    `https://e-learning.darelkubra.com/${lang}/verify/${courseId}`;

  useEffect(() => {
    QRCode.toDataURL(qrPath, { width: 120 }).then(setQrCodeData);
  }, [qrPath]);

  const signInstructor = "/sign.png";
  const signAuthorized = "/stamp_logo.png";

  const resultLabel =
    result === "excellent"
      ? "Excellent"
      : result === "verygood"
      ? "Very Good"
      : result === "good"
      ? "Good"
      : "Poor";
  const resultLabelAr =
    result === "excellent"
      ? "ممتاز"
      : result === "verygood"
      ? "جيد جدا"
      : result === "good"
      ? "جيد"
      : "ضعيف";

  return (
    <div
      ref={ref}
      className="relative shadow-2xl rounded-[24px] overflow-hidden border-8 border-[#e9d8a6] print:shadow-none print:border-0 certificate-container"
    >
      <div className="relative h-36 bg-gradient-to-b from-[#ffe5b4] to-white flex flex-col justify-center">
        <div className="flex flex-row justify-between items-center px-10 pt-4 pb-1 gap-2">
          <div className="text-xs md:text-sm font-semibold text-[#2f4f4f] text-left whitespace-nowrap">
            DARULKUBRA QURAN AND ISLAMIC STUDIES CENTER
          </div>
          <div className="flex-shrink-0 flex-grow-0">
            <Image
              src="/darulkubra.png"
              alt="DarulKubra logo"
              width={160}
              height={64}
              className="mx-auto h-12 md:h-14 print:h-16 w-auto"
              priority
            />
          </div>
          <div
            className="text-xs md:text-sm font-semibold text-[#2f4f4f] text-right whitespace-nowrap"
            lang="ar"
            dir="rtl"
          >
            مركز دار الكبرى للقرآن الكريم والدراسات الإسلامية
          </div>
        </div>
        <div className="absolute inset-x-0 -top-6 h-12 bg-[#e9d8a6] rounded-b-[36px] mx-10" />
        <div className="relative z-10 text-center mt-2">
          <div className="text-[#2f4f4f] tracking-widest text-sm">
            CERTIFICATE OF COMPLETION
          </div>
          <div className="text-3xl font-extrabold text-[#2f4f4f] mt-1">
            {data.courseTitle}
          </div>
        </div>
      </div>

      <div className="px-10 py-8 text-center">
        <div className="text-sm text-slate-500">This certifies that</div>
        <div className="mt-2 text-4xl font-bold text-[#547e4e]">
          {data.studentName}
        </div>
        <div className="mt-5 max-w-4xl mx-auto flex flex-row items-stretch gap-0 text-slate-700 leading-relaxed text-left">
          <div className="flex-1 p-4">
            <p>
              This certificate is hereby awarded to {data.studentName} for
              successfully completing this course and passing the final
              assessment with a score of <b>{Math.round(data.percent)}%</b>.
              This achievement reflects dedication, strong performance, and a
              commitment to continuous learning. Final result:{" "}
              <b>{resultLabel}</b>. Issued on <b>{issuedStr}</b>.
            </p>
          </div>
          <div className="flex w-px bg-slate-300 mx-0 my-4 print:my-0 print:mx-0" />
          <div className="flex-1 p-4 text-right" lang="ar" dir="rtl">
            <p>
              يشهد مركز دار الكبرى لتعليم القرآن والعلوم الدينية بأن المتعلم{" "}
              {data.studentName} قد أكمل هذا المساق بنجاح واجتاز التقييم النهائي
              بنسبة <b>{Math.round(data.percent)}%</b>. ويعكس ذلك تفوقه والتزامه
              بالجد والاجتهاد والتعلم المستمر. النتيجة النهائية:
              <b> {resultLabelAr}</b>. تاريخ الإصدار: <b>{issuedStr}</b>.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-8 max-w-3xl mx-auto items-end">
          <div className="text-left">
            <img
              src={signInstructor}
              alt="Instructor signature"
              className="h-10 object-contain mb-2 opacity-90"
            />
            <div className="h-px bg-slate-300 mb-1" />
            <div className="text-sm font-medium">Course Instructor</div>
            <div className="text-xs text-slate-500">
              {data.instructorName || "Signature"}
            </div>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-20 h-20 rounded-full bg-[#e9d8a6] border-4 border-[#f1e9c9] flex items-center justify-center shadow-inner">
              <Trophy className="w-10 h-10 text-[#8b5e34]" />
            </div>
          </div>
          <div className="text-right">
            <Image
              src={signAuthorized}
              alt="Authorized signature"
              width={180}
              height={120}
              className="h-40 object-contain mb-2 ml-auto opacity-90"
            />
            <div className="h-px bg-slate-300 mb-1" />
            <div className="text-sm font-medium">Authorized</div>
            <div className="text-xs text-slate-500">DarulKubra Acadamy</div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="text-xs text-slate-500">Scan to verify</div>
          <div className="bg-white p-2 rounded-md border border-slate-200">
            <img src={qrCodeData} alt="QR code" width={60} height={60} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AmharicCertification({
  data,
  lang,
  courseId,
}: {
  data: CertificateData;
  lang: string;
  courseId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCodeData, setQrCodeData] = useState("");

  const issued = new Date(data.issuedAt);
  const issuedStr = issued.toLocaleDateString();
  const result = String(data.result || "").toLowerCase();

  // Use full URL from data (server returns full URL with userId)
  const qrPath =
    data.qrcode ||
    `https://e-learning.darelkubra.com/${lang}/verify/${courseId}`;

  useEffect(() => {
    async function generateQr() {
      const url = await QRCode.toDataURL(qrPath, { width: 120 });
      setQrCodeData(url);
    }
    generateQr();
  }, [qrPath]);

  const signInstructor = "/sign.png";
  const signAuthorized = "/stamp_logo.png";

  const resultLabelAm =
    result === "excellent"
      ? "ምርጥ"
      : result === "verygood"
      ? "በጣም ጥሩ"
      : result === "good"
      ? "ጥሩ"
      : "ደካማ";
  const resultLabelAr =
    result === "excellent"
      ? "ممتاز"
      : result === "verygood"
      ? "جيد جدا"
      : result === "good"
      ? "جيد"
      : "ضعيف";

  return (
    <div
      ref={ref}
      className="relative shadow-2xl rounded-[24px] overflow-hidden border-8 border-[#e9d8a6] print:shadow-none print:border-0 certificate-container"
    >
      <div className="relative h-36 bg-gradient-to-b from-[#ffe5b4] to-white flex flex-col justify-center">
        <div className="flex flex-row justify-between items-center px-10 pt-4 pb-1 gap-2">
          <div
            className="text-xs md:text-sm font-semibold text-[#2f4f4f] text-left whitespace-nowrap"
            lang="am"
          >
            ዳሩልኩብራ የቁርአን እና እስልምና ጥናት ማዕከል
          </div>
          <div className="flex-shrink-0 flex-grow-0">
            <Image
              src="/darulkubra.png"
              alt="DarulKubra logo"
              width={160}
              height={64}
              className="mx-auto h-12 md:h-14 print:h-16 w-auto"
              priority
            />
          </div>
          <div
            className="text-xs md:text-sm font-semibold text-[#2f4f4f] text-right whitespace-nowrap"
            lang="ar"
            dir="rtl"
          >
            مركز دار الكبرى للقرآن الكريم والدراسات الإسلامية
          </div>
        </div>
        <div className="absolute inset-x-0 -top-6 h-12 bg-[#e9d8a6] rounded-b-[36px] mx-10" />
        <div className="relative z-10 text-center mt-2">
          <div className="text-[#2f4f4f] tracking-widest text-sm">
            CERTIFICATE OF COMPLETION
          </div>
          <div className="text-3xl font-extrabold text-[#2f4f4f] mt-1">
            {data.courseTitle}
          </div>
        </div>
      </div>

      <div className="px-10 py-8 text-center">
        <div className="text-sm text-slate-500">This certifies that</div>
        <div className="mt-2 text-4xl font-bold text-[#547e4e]">
          {data.studentName}
        </div>
        <div className="mt-5 max-w-4xl mx-auto flex flex-row items-stretch gap-0 text-slate-700 leading-relaxed text-left">
          <div className="flex-1 p-4">
            <p>
              እ.ኤ.አ {data.studentName} ይህን ኮርስ በተሳካ ሁኔታ ተጠናቅቋል እና የመጨረሻውን ግምገማ በ{" "}
              <b>{Math.round(data.percent)}%</b> ውጤት አልፏል። ይህ ስኬት ትጉህነት፣ ጥረት እና
              በቀጣይ መማር ላይ ያለ ቁርጠኝነትን ያሳያል። መጨረሻ ውጤት:
              <b> {resultLabelAm}</b>። የተሰጠበት ቀን: <b>{issuedStr}</b>።
            </p>
          </div>
          <div className="flex w-px bg-slate-300 mx-0 my-4 print:my-0 print:mx-0" />
          <div className="flex-1 p-4 text-right" lang="ar" dir="rtl">
            <p>
              يشهد مركز دار الكبرى لتعليم القرآن والعلوم الدينية بأن المتعلم{" "}
              {data.studentName} قد أكمل هذا المساق بنجاح واجتاز التقييم النهائي
              بنسبة <b>{Math.round(data.percent)}%</b>. ويعكس ذلك تفوقه والتزامه
              بالجد والاجتهاد والتعلم المستمر. النتيجة النهائية:
              <b> {resultLabelAr}</b>. تاريخ الإصدار: <b>{issuedStr}</b>.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-8 max-w-3xl mx-auto items-end">
          <div className="text-left">
            <img
              src={signInstructor}
              alt="Instructor signature"
              className="h-10 object-contain mb-2 opacity-90"
            />
            <div className="h-px bg-slate-300 mb-1" />
            <div className="text-sm font-medium">Course Instructor</div>
            <div className="text-xs text-slate-500">
              {data.instructorName || "Signature"}
            </div>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-20 h-20 rounded-full bg-[#e9d8a6] border-4 border-[#f1e9c9] flex items-center justify-center shadow-inner">
              <Trophy className="w-10 h-10 text-[#8b5e34]" />
            </div>
          </div>
          <div className="text-right">
            <Image
              src={signAuthorized}
              alt="Authorized signature"
              width={180}
              height={120}
              className="h-40 object-contain mb-2 ml-auto opacity-90"
            />
            <div className="h-px bg-slate-300 mb-1" />
            <div className="text-sm font-medium">Authorized</div>
            <div className="text-xs text-slate-500">Mube Academy</div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="text-xs text-slate-500">Scan to verify</div>
          <div className="bg-white p-2 rounded-md border border-slate-200">
            <img src={qrCodeData} alt="QR code" width={60} height={60} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificateDetailPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; courseId: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.courseId || "";
  const certRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const {
    data: certData,
    loading,
    error,
  } = useData({
    func: getCertificateDetails,
    args: [courseId],
  });

  const cert = (certData || {}) as CertificateData;

  const [activeIdx, setActiveIdx] = useState(0);
  const labels = ["English", "Amharic"];
  const [isDownloading, setIsDownloading] = useState(false);

  const A4_WIDTH = 1123;
  const A4_HEIGHT = 794;

  const handleDownload = async () => {
    const node = certRef.current;
    if (!node) return;

    setIsDownloading(true);

    let originalWidth = "";
    let originalMinWidth = "";
    let originalMaxWidth = "";
    let originalHeight = "";
    let originalMinHeight = "";
    let originalMaxHeight = "";
    let originalMargin = "";
    let originalTransform = "";
    let originalPosition = "";
    let originalOverflow = "";
    let originalPadding = "";
    let certContainer: HTMLElement | null = null;
    let originalContainerTransform = "";
    let originalContainerWidth = "";
    let originalContainerMaxWidth = "";
    let originalContainerHeight = "";
    let originalContainerMinHeight = "";
    let originalContainerOverflow = "";
    let originalContainerBorder = "";

    try {
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 100));

      certContainer = node.querySelector(
        ".certificate-container"
      ) as HTMLElement;

      if (!certContainer) {
        throw new Error("Certificate container not found");
      }

      originalWidth = node.style.width;
      originalMinWidth = node.style.minWidth;
      originalMaxWidth = node.style.maxWidth;
      originalHeight = node.style.height;
      originalMinHeight = node.style.minHeight;
      originalMaxHeight = node.style.maxHeight;
      originalMargin = node.style.margin;
      originalTransform = node.style.transform;
      originalPosition = node.style.position;
      originalOverflow = node.style.overflow;
      originalPadding = node.style.padding;

      originalContainerTransform = certContainer.style.transform;
      originalContainerWidth = certContainer.style.width;
      originalContainerMaxWidth = certContainer.style.maxWidth;
      originalContainerHeight = certContainer.style.height;
      originalContainerMinHeight = certContainer.style.minHeight;
      originalContainerOverflow = certContainer.style.overflow;
      originalContainerBorder = certContainer.style.border;

      node.style.width = `${A4_WIDTH}px`;
      node.style.minWidth = `${A4_WIDTH}px`;
      node.style.maxWidth = `${A4_WIDTH}px`;
      node.style.height = `${A4_HEIGHT}px`;
      node.style.minHeight = `${A4_HEIGHT}px`;
      node.style.maxHeight = `${A4_HEIGHT}px`;
      node.style.margin = "0";
      node.style.padding = "0";
      node.style.transform = "none";
      node.style.position = "relative";
      node.style.overflow = "visible";
      node.style.boxSizing = "border-box";

      certContainer.style.width = `${A4_WIDTH}px`;
      certContainer.style.minWidth = `${A4_WIDTH}px`;
      certContainer.style.maxWidth = `${A4_WIDTH}px`;
      certContainer.style.height = `${A4_HEIGHT}px`;
      certContainer.style.minHeight = `${A4_HEIGHT}px`;
      certContainer.style.maxHeight = `${A4_HEIGHT}px`;
      certContainer.style.transform = "none";
      certContainer.style.overflow = "visible";
      certContainer.style.boxSizing = "border-box";
      certContainer.style.margin = "0";
      certContainer.style.padding = "0";
      certContainer.style.position = "relative";

      await new Promise((resolve) => setTimeout(resolve, 300));

      const rect = certContainer.getBoundingClientRect();
      const actualWidth = Math.ceil(rect.width) || A4_WIDTH;
      const actualHeight = Math.ceil(rect.height) || A4_HEIGHT;

      const dataUrl = await toPng(certContainer, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1.0,
        backgroundColor: "#ffffff",
      });

      const img = new window.Image();
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const imgWidth = img.width;
            const imgHeight = img.height;

            const pdf = new jsPDF({
              orientation: imgWidth > imgHeight ? "landscape" : "portrait",
              unit: "px",
              format: [imgWidth, imgHeight],
            });

            pdf.addImage(
              dataUrl,
              "PNG",
              0,
              0,
              imgWidth,
              imgHeight,
              undefined,
              "FAST"
            );

            pdf.save("certificate.pdf");
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
      });
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      if (node) {
        node.style.width = originalWidth;
        node.style.minWidth = originalMinWidth;
        node.style.maxWidth = originalMaxWidth;
        node.style.height = originalHeight;
        node.style.minHeight = originalMinHeight;
        node.style.maxHeight = originalMaxHeight;
        node.style.margin = originalMargin;
        node.style.padding = originalPadding;
        node.style.transform = originalTransform;
        node.style.position = originalPosition;
        node.style.overflow = originalOverflow;
        node.style.boxSizing = "";

        if (certContainer) {
          certContainer.style.transform = originalContainerTransform;
          certContainer.style.width = originalContainerWidth;
          certContainer.style.maxWidth = originalContainerMaxWidth;
          certContainer.style.height = originalContainerHeight;
          certContainer.style.minHeight = originalContainerMinHeight;
          certContainer.style.overflow = originalContainerOverflow;
          certContainer.style.border = originalContainerBorder;
          certContainer.style.boxSizing = "";
          certContainer.style.margin = "";
          certContainer.style.padding = "";
        }
      }
      setIsDownloading(false);
    }
  };

  const goPrev = () => setActiveIdx((i) => (i === 0 ? 1 : i - 1));
  const goNext = () => setActiveIdx((i) => (i === 1 ? 0 : i + 1));

  const globalLoading = useGlobalLoading();
  
  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) {
    return null;
  }

  if (
    error ||
    !certData?.status ||
    certData.result === "nottaken" ||
    certData.result === "error"
  ) {
    return (
      <div className="h-full bg-background text-foreground flex items-center justify-center p-6 overflow-auto">
        <div className="max-w-md w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-1">
            Certificate Unavailable
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Please complete the final exam first.
          </p>
          <Button onClick={() => router.back()} variant="flat">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="certificate-print"
      className="w-full min-h-screen text-[#1f2937] p-0 print:p-0"
      style={{
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print,
          #certificate-print * {
            visibility: visible !important;
          }
          #certificate-print {
            position: fixed;
            inset: 0;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #f7f2e9 !important;
          }
          .certificate-scroll-wrapper {
            overflow: visible !important;
          }
          .certificate-a4 {
            width: 1123px !important;
            height: 794px !important;
            min-width: 1123px !important;
            min-height: 794px !important;
            max-width: 1123px !important;
            max-height: 794px !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
        .certificate-scroll-wrapper {
          width: 100%;
          overflow-x: auto !important;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 1123px) {
          .certificate-scroll-wrapper {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            width: 100%;
            max-width: 100vw;
            overflow-x: visible !important;
          }
        }
        @media (max-width: 768px) {
          .certificate-scroll-wrapper {
            padding: 10px 0;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          .certificate-container {
            min-width: 1123px;
          }
        }
        .certificate-a4 {
          width: 1123px;
          min-width: 1123px;
          max-width: 1123px;
          margin-left: auto;
          margin-right: auto;
          overflow: visible !important;
        }
        @media (max-width: 768px) {
          .certificate-a4 {
            margin-left: 0;
            margin-right: 0;
          }
        }
        body {
          overflow-x: hidden !important;
        }
      `}</style>
      <div className="w-full min-h-dvh flex flex-col justify-start items-center p-3 sm:p-4">
        <div className="w-full max-w-none min-w-0 flex flex-col">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 print:hidden gap-3">
            {/* Back Button */}
            <Button
              onClick={() => router.back()}
              variant="flat"
              startContent={<ArrowLeft className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Back
            </Button>

            {/* Download button */}
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              color="primary"
              className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 min-h-[44px] sm:min-h-0"
              startContent={
                isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )
              }
            >
              {isDownloading ? "Generating PDF..." : "Download Certificate"}
            </Button>

            {/* Language switcher */}
            <div className="flex flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Button
                onClick={goPrev}
                variant="flat"
                isIconOnly
                size="sm"
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm sm:text-base text-slate-600 font-medium min-w-[120px] text-center">
                {labels[activeIdx]} Certificate
              </span>
              <Button
                onClick={goNext}
                variant="flat"
                isIconOnly
                size="sm"
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Certificate Canvas */}
          <div className="certificate-scroll-wrapper" ref={scrollWrapperRef}>
            <div
              ref={certRef}
              className="certificate-a4"
              style={{
                width: `${A4_WIDTH}px`,
                minWidth: `${A4_WIDTH}px`,
                maxWidth: `${A4_WIDTH}px`,
                marginLeft: "auto",
                marginRight: "auto",
                ...(typeof window !== "undefined" &&
                !window.matchMedia("print").matches
                  ? { height: "auto", minHeight: "0", maxHeight: "none" }
                  : {
                      height: `${A4_HEIGHT}px`,
                      minHeight: `${A4_HEIGHT}px`,
                      maxHeight: `${A4_HEIGHT}px`,
                    }),
                background: "#fff",
                overflow: "visible",
              }}
            >
              {activeIdx === 0 ? (
                <EnglishCertification
                  data={cert}
                  lang={lang}
                  courseId={courseId}
                />
              ) : (
                <AmharicCertification
                  data={cert}
                  lang={lang}
                  courseId={courseId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
