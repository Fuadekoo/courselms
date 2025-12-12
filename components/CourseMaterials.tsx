"use client";

import React, { useMemo, useState } from "react";
import {
  File,
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  Eye,
  X,
} from "lucide-react";
import { getCourseMaterials } from "@/lib/data/courseMaterials";
import useData from "@/hooks/useData";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@heroui/react";

interface CourseMaterial {
  name: string;
  url: string;
  type: string;
}

export default function CourseMaterials({
  courseId,
  lang,
}: {
  courseId: string;
  lang: string;
}) {
  const { data: materials, loading } = useData({
    func: getCourseMaterials,
    args: [courseId],
  });

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewing, setViewing] = useState<CourseMaterial | null>(null);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "ppt":
      case "pptx":
        return <Presentation className="w-5 h-5 text-orange-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileTypeLabel = (type: string) => {
    return type.toUpperCase();
  };

  const officeViewerUrl = (url: string) => {
    const absolute = url.startsWith("http")
      ? url
      : typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      absolute
    )}`;
  };

  const canInlinePreview = (type: string) => {
    const t = type.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "txt"].includes(t);
  };

  const openViewer = (material: CourseMaterial) => {
    setViewing(material);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewing(null);
  };

  const viewerContent = useMemo(() => {
    if (!viewing) return null;
    const type = viewing.type.toLowerCase();
    const src = (() => {
      if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(type)) {
        return officeViewerUrl(viewing.url);
      }
      return viewing.url;
    })();

    if (["jpg", "jpeg", "png", "gif"].includes(type)) {
      return (
        <img
          src={src}
          alt={viewing.name}
          className="max-h-[80vh] w-auto object-contain"
        />
      );
    }

    // Fallback to iframe for pdf, txt and others that can render inline
    return (
      <iframe
        src={src}
        className="w-full h-[80vh] rounded-lg border"
        loading="eager"
      />
    );
  }, [viewing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-medium mb-2">
          {lang === "en" ? "No Additional Materials" : "ተጨማሪ ቅረጾች የሉም"}
        </h3>
        <p className="text-gray-500">
          {lang === "en"
            ? "Check back for additional course materials"
            : "ለተጨማሪ የኮርስ ቅረጾች በኋላ በድጋሚ ይመለሱ"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material: CourseMaterial, index: number) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getFileIcon(material.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {material.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                    {getFileTypeLabel(material.type)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openViewer(material)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                      title={lang === "en" ? "Read" : "አንብብ"}
                    >
                      <Eye className="w-4 h-4" />
                      {lang === "en" ? "Read" : "አንብብ"}
                    </button>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Download className="w-4 h-4" />
                      {lang === "en" ? "Download" : "አውርድ"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Material Preview Modal */}
      <Modal
        isOpen={viewerOpen}
        onClose={closeViewer}
        size="full"
        classNames={{
          base: "!w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 !rounded-none",
          backdrop: "bg-black/60",
          wrapper: "!p-0",
        }}
        hideCloseButton
        scrollBehavior="inside"
      >
        <ModalContent className="!w-full !h-full !max-w-none !max-h-none !m-0 !p-0 !rounded-none">
          <ModalHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(viewing?.type || "")}
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                    {viewing?.name || "Course Material Preview"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getFileTypeLabel(viewing?.type || "")} •{" "}
                    {lang === "en" ? "Course Material" : "የኮርስ ቅረጽ"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="bordered"
                  size="sm"
                  startContent={<Download className="h-4 w-4" />}
                  onPress={() => {
                    if (viewing) {
                      const link = document.createElement("a");
                      link.href = viewing.url;
                      link.download = viewing.name;
                      link.target = "_blank";
                      link.click();
                    }
                  }}
                >
                  {lang === "en" ? "Download" : "አውርድ"}
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={closeViewer}
                  aria-label={lang === "en" ? "Close" : "ዝጋ"}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="flex-1 overflow-auto bg-muted/30 !p-0">
            {viewing ? (
              <div className="w-full h-full flex items-center justify-center p-6">
                {viewing.url.startsWith("data:application/pdf") ||
                viewing.url.includes(".pdf") ? (
                  <iframe
                    src={viewing.url}
                    className="w-full h-full min-h-[600px] border border-border rounded-lg bg-white"
                    title={viewing.name}
                  />
                ) : viewing.url.startsWith("data:image/") ||
                  ["jpg", "jpeg", "png", "gif"].includes(
                    viewing.type.toLowerCase()
                  ) ? (
                  <img
                    src={viewing.url}
                    alt={viewing.name}
                    className="max-w-full max-h-full object-contain border border-border rounded-lg shadow-lg bg-white"
                  />
                ) : ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(
                    viewing.type.toLowerCase()
                  ) ? (
                  <iframe
                    src={officeViewerUrl(viewing.url)}
                    className="w-full h-full min-h-[600px] border border-border rounded-lg bg-white"
                    title={viewing.name}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      {lang === "en"
                        ? "Unable to preview this file type"
                        : "ይህንን የፋይል አይነት ማየት አይቻልም"}
                    </p>
                    <Button
                      variant="bordered"
                      startContent={<Download className="h-4 w-4" />}
                      onPress={() => {
                        const link = document.createElement("a");
                        link.href = viewing.url;
                        link.download = viewing.name;
                        link.target = "_blank";
                        link.click();
                      }}
                    >
                      {lang === "en" ? "Download to View" : "ለመመልከት አውርድ"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {lang === "en" ? "No material available" : "ቅረጽ አልተገኘም"}
                </p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
