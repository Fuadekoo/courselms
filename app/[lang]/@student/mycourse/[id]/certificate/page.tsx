/* eslint-disable @next/next/no-img-element */
"use client";
import useData from "@/hooks/useData";
import QRCode from "qrcode";
import Image from "next/image";
import { getCertificateDetails } from "@/actions/student/mycourse";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Trophy, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useEffect } from "react";
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
  // const percent = Math.round(data.percent || 0);
  const result = String(data.result || "").toLowerCase();

  // Use full URL from data (server returns full URL with userId)
  const qrPath =
    data.qrcode ||
    `https://e-learning.darelkubra.com/${lang}/verify/${courseId}`;

  // Generate QR code when qrPath changes
  useEffect(() => {
    QRCode.toDataURL(qrPath, { width: 120 }).then(setQrCodeData);
  }, [qrPath]);

  // Signature and stamp assets
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
      {/* Decorative header with bilingual center name and logo on the same x axis */}
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
          {data.studentName || "Student Name"}
        </div>
        {/* Bilingual body: English (left) + Arabic (right) with vertical divider */}
        <div className="mt-5 max-w-4xl mx-auto flex flex-row items-stretch gap-0 text-slate-700 leading-relaxed text-left">
          <div className="flex-1 p-4">
            <p>
              This certificate is hereby awarded to {data.studentName || "Student Name"} for
              successfully completing this course and passing the final
              assessment with a score of <b>{Math.round(data.percent)}%</b>.
              This achievement reflects dedication, strong performance, and a
              commitment to continuous learning. Final result: {" "}
              <b>{resultLabel}</b>. Issued on <b>{issuedStr}</b>.
            </p>
          </div>
          {/* Vertical divider for desktop/print */}
          <div className="flex w-px bg-slate-300 mx-0 my-4 print:my-0 print:mx-0" />
          <div className="flex-1 p-4 text-right" lang="ar" dir="rtl">
            <p>
              يشهد مركز دار الكبرى لتعليم القرآن والعلوم الدينية بأن المتعلم{" "}
              {data.studentName || "Student Name"} قد أكمل هذا المساق بنجاح واجتاز التقييم النهائي
              بنسبة <b>{Math.round(data.percent)}%</b>. ويعكس ذلك تفوقه والتزامه
              بالجد والاجتهاد والتعلم المستمر. النتيجة النهائية:
              <b> {resultLabelAr}</b>. تاريخ الإصدار: <b>{issuedStr}</b>.
            </p>
          </div>
        </div>

        {/* Signatures and Trophy in one row */}
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
          {/* Trophy centered */}
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

        {/* QR Code for verification */}
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
  // const percent = Math.round(data.percent || 0);

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

  // Signature and stamp assets
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
      {/* Decorative header with bilingual center name and logo on the same x axis */}
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
          {data.studentName || "Student Name"}
        </div>
        {/* Bilingual body: Amharic (left) + Arabic (right) with vertical divider */}
        <div className="mt-5 max-w-4xl mx-auto flex flex-row items-stretch gap-0 text-slate-700 leading-relaxed text-left">
          <div className="flex-1 p-4">
            <p>
              እ.ኤ.አ {data.studentName || "Student Name"} ይህን ኮርስ በተሳካ ሁኔታ ተጠናቅቋል እና የመጨረሻውን ግምገማ በ{" "}
              <b>{Math.round(data.percent)}%</b> ውጤት አልፏል። ይህ ስኬት ትጉህነት፣ ጥረት እና
              በቀጣይ መማር ላይ ያለ ቁርጠኝነትን ያሳያል። መጨረሻ ውጤት:
              <b> {resultLabelAm}</b>። የተሰጠበት ቀን: <b>{issuedStr}</b>።
            </p>
          </div>
          {/* Vertical divider for desktop/print */}
          <div className="flex w-px bg-slate-300 mx-0 my-4 print:my-0 print:mx-0" />
          <div className="flex-1 p-4 text-right" lang="ar" dir="rtl">
            <p>
              يشهد مركز دار الكبرى لتعليم القرآن والعلوم الدينية بأن المتعلم{" "}
              {data.studentName || "Student Name"} قد أكمل هذا المساق بنجاح واجتاز التقييم النهائي
              بنسبة <b>{Math.round(data.percent)}%</b>. ويعكس ذلك تفوقه والتزامه
              بالجد والاجتهاد والتعلم المستمر. النتيجة النهائية:
              <b> {resultLabelAr}</b>. تاريخ الإصدار: <b>{issuedStr}</b>.
            </p>
          </div>
        </div>

        {/* Signatures and Trophy in one row */}
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
          {/* Trophy centered */}
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

        {/* QR Code for verification */}
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

export default function Page() {
  const router = useRouter();
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.id || "";
  const certRef = useRef<HTMLDivElement>(null); // rename from certificateRef
  const scrollWrapperRef = useRef<HTMLDivElement>(null); // add this ref

  const { data, loading } = useData({
    func: getCertificateDetails,
    args: [courseId],
  });
  const cert = (data || {}) as CertificateData;

  const [activeIdx, setActiveIdx] = useState(0); // 0: English, 1: Amharic
  const labels = ["English", "Amharic"];
  const [isDownloading, setIsDownloading] = useState(false);

  const A4_WIDTH = 1123; // px (A4 landscape at 96dpi)
  const A4_HEIGHT = 794; // px

  // Download PDF function - works same on mobile and desktop
  const handleDownload = async () => {
    const node = certRef.current;
    if (!node) return;

    setIsDownloading(true);

    // Store original styles to restore later (declare outside try for finally access)
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
      // Scroll to top to ensure certificate is visible
      window.scrollTo(0, 0);

      // Wait a bit for scroll to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find the actual certificate container (the one with border-8)
      certContainer = node.querySelector(
        ".certificate-container"
      ) as HTMLElement;

      if (!certContainer) {
        throw new Error("Certificate container not found");
      }

      // Store original styles of the parent node
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

      // Store certificate container styles
      originalContainerTransform = certContainer.style.transform;
      originalContainerWidth = certContainer.style.width;
      originalContainerMaxWidth = certContainer.style.maxWidth;
      originalContainerHeight = certContainer.style.height;
      originalContainerMinHeight = certContainer.style.minHeight;
      originalContainerOverflow = certContainer.style.overflow;
      originalContainerBorder = certContainer.style.border;

      // Set parent node to exact A4 dimensions with no padding/margin
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

      // Set certificate container to fill parent exactly (including border)
      // Use border-box so border is included in the width/height
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

      // Wait for styles to apply and layout to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get the actual computed dimensions after styles are applied
      // This ensures we capture the full certificate including border
      const rect = certContainer.getBoundingClientRect();
      const actualWidth = Math.ceil(rect.width) || A4_WIDTH;
      const actualHeight = Math.ceil(rect.height) || A4_HEIGHT;

      // Generate image with high quality - capture the certificate container directly
      // Don't specify width/height to let it capture at natural size (prevents clipping)
      const dataUrl = await toPng(certContainer, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1.0,
        backgroundColor: "#ffffff",
        // Let toPng determine the natural size to avoid any clipping
        // This ensures borders, shadows, and all content are captured
      });

      // Create PDF with actual dimensions
      const img = new window.Image();
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Use actual image dimensions to ensure nothing is cut
            const imgWidth = img.width;
            const imgHeight = img.height;

            // Create PDF with exact image dimensions
            const pdf = new jsPDF({
              orientation: imgWidth > imgHeight ? "landscape" : "portrait",
              unit: "px",
              format: [imgWidth, imgHeight],
            });

            // Add image to PDF at full size (no scaling, no clipping)
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

            // Save PDF - works on both mobile and desktop
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
      // Restore original styles
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

  // const printPdf = () => {
  //   window.print(); // prints current visible certificate
  // };

  const goPrev = () => setActiveIdx((i) => (i === 0 ? 1 : i - 1));
  const goNext = () => setActiveIdx((i) => (i === 1 ? 0 : i + 1));

  const globalLoading = useGlobalLoading();
  
  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) {
    return null;
  }

  if (!data?.status || data.result === "nottaken" || data.result === "error") {
    return (
      <div className="h-full bg-background text-foreground flex items-center justify-center p-6 overflow-auto">
        <div className="max-w-md w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-1">
            Certificate Unavailable
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Please complete the final exam first.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Redirect to profile if student name is missing
  if (!data?.studentName || data.studentName.trim() === "") {
    return (
      <div className="h-full bg-background text-foreground flex items-center justify-center p-6 overflow-auto">
        <div className="max-w-md w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-1">
            Profile Incomplete
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Please complete your profile information before accessing your certificate.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push(`/${lang}/profile?redirect=${encodeURIComponent(`/${lang}/mycourse/${courseId}/certificate`)}`)}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="certificate-print"
      className="w-full min-h-screen text-[#1f2937] p-0 print:p-0"
      style={{
        overflowX: "auto", // Enable horizontal scroll on the page itself
        overflowY: "auto",
      }}
    >
      <style jsx global>{`
        @media print {
          /* Hide entire app except the certificate area */
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
        /* Certificate scroll wrapper - responsive */
        .certificate-scroll-wrapper {
          width: 100%;
          overflow-x: auto !important;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        }

        /* Desktop: center the certificate */
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

        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          .certificate-scroll-wrapper {
            padding: 10px 0;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          /* Ensure certificate container is scrollable on mobile */
          .certificate-container {
            min-width: 1123px; /* Keep original width for proper display */
          }
        }

        /* Certificate A4 dimensions */
        .certificate-a4 {
          width: 1123px;
          min-width: 1123px;
          max-width: 1123px;
          margin-left: auto;
          margin-right: auto;
          overflow: visible !important;
        }

        /* Mobile: adjust margins for better scrolling */
        @media (max-width: 768px) {
          .certificate-a4 {
            margin-left: 0;
            margin-right: 0;
          }
        }
        /* Prevent body horizontal scrollbars (handled by #certificate-print) */
        body {
          overflow-x: hidden !important;
        }
      `}</style>
      <div className="w-full min-h-dvh flex flex-col justify-start items-center p-3 sm:p-4">
        <div className="w-full max-w-none min-w-0 flex flex-col">
          {/* Common Navigation - Outside of certificate functions */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 print:hidden gap-3">
            {/* Download button - Full width on mobile, auto on desktop */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white inline-flex items-center justify-center gap-2 font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px] sm:min-h-0"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span>Download Certificate</span>
                </>
              )}
            </button>

            {/* Center: Language switcher and navigation */}
            <div className="flex flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <button
                onClick={goPrev}
                className="p-2.5 sm:p-2 rounded-md border border-slate-300 hover:bg-slate-50 active:bg-slate-100 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Previous certificate"
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <span className="text-sm sm:text-base text-slate-600 font-medium min-w-[120px] text-center">
                {labels[activeIdx]} Certificate
              </span>
              <button
                onClick={goNext}
                className="p-2.5 sm:p-2 rounded-md border border-slate-300 hover:bg-slate-50 active:bg-slate-100 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Next certificate"
                title="Next"
              >
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Certificate Canvas */}
          <div
            className="certificate-scroll-wrapper w-full"
            ref={scrollWrapperRef}
          >
            <div
              ref={certRef} // use certRef here
              className="certificate-a4"
              style={{
                width: `${A4_WIDTH}px`,
                minWidth: `${A4_WIDTH}px`,
                maxWidth: `${A4_WIDTH}px`,
                marginLeft: "auto",
                marginRight: "auto",
                // Remove height constraints for UI scroll, only set in print
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
