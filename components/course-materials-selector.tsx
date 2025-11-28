"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Select, SelectItem } from "@heroui/react";
import { FileText } from "lucide-react";
import { CourseMaterialsManager } from "./course-materials-manager";
import { AiPdfUploader } from "./ai-pdf-uploader";
import { AiAssistantSelector } from "./ai-selector";

interface CoursePackage {
  id: string;
  titleEn: string;
  titleAm: string;
  aboutEn: string;
  aboutAm: string;
  courseMaterials: string | null;
  pdfData?: string | null;
  aiProvider: string | null;
  status: boolean;
  _count: {
    order: number;
  };
}

interface CourseMaterialsSelectorProps {
  coursePackages: CoursePackage[];
}

export function CourseMaterialsSelector({
  coursePackages,
}: CourseMaterialsSelectorProps) {
  const [selectedAiPdfPackage, setSelectedAiPdfPackage] = useState<string>(
    coursePackages.length > 0 ? coursePackages[0].id : ""
  );
  const [selectedMaterialsPackage, setSelectedMaterialsPackage] =
    useState<string>(coursePackages.length > 0 ? coursePackages[0].id : "");

  const [selectedAiPdfData, setSelectedAiPdfData] = useState<
    CoursePackage | undefined
  >();
  const [selectedMaterialsData, setSelectedMaterialsData] = useState<
    CoursePackage | undefined
  >();

  useEffect(() => {
    const aiPdfData = coursePackages.find(
      (pkg) => pkg.id === selectedAiPdfPackage
    );
    setSelectedAiPdfData(aiPdfData);
  }, [selectedAiPdfPackage, coursePackages]);
  useEffect(() => {
    const materialsData = coursePackages.find(
      (pkg) => pkg.id === selectedMaterialsPackage
    );
    setSelectedMaterialsData(materialsData);
  }, [selectedMaterialsPackage, coursePackages]);

  return (
    <div className="space-y-6">
      {/* AI PDF Data Section */}
      <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <Select
            label="Select Course"
            placeholder="Choose course package for AI PDF"
            selectedKeys={selectedAiPdfPackage ? [selectedAiPdfPackage] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) setSelectedAiPdfPackage(selected.toString());
            }}
            className="w-full max-w-md"
          >
            {coursePackages.map((pkg) => (
              <SelectItem key={pkg.id} textValue={pkg.titleEn}>{pkg.titleEn}</SelectItem>
            ))}
          </Select>
        </CardHeader>
        <CardBody>
          {selectedAiPdfData && (
            <AiAssistantSelector
              key={`ai-selector-${selectedAiPdfData.id}`}
              courseId={selectedAiPdfData.id}
              currentAIProvider={selectedAiPdfData.aiProvider}
            />
          )}
          {selectedAiPdfData && (
            <AiPdfUploader
              key={`ai-uploader-${selectedAiPdfData.id}`}
              courseId={selectedAiPdfData.id}
              currentAiPdfData={selectedAiPdfData.pdfData || null}
              aiProvider={selectedAiPdfData.aiProvider}
            />
          )}
        </CardBody>
      </Card>

      {/* Course Materials Section */}
      <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
        <Select
          label="Select Course"
          placeholder="Choose course package for materials"
          selectedKeys={
            selectedMaterialsPackage ? [selectedMaterialsPackage] : []
          }
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            if (selected) setSelectedMaterialsPackage(selected.toString());
          }}
          className="w-full max-w-md"
        >
          {coursePackages.map((pkg) => (
            <SelectItem key={pkg.id}>{pkg.titleEn}</SelectItem>
          ))}
        </Select>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Course Materials
            </h2>
          </div>
        </CardHeader>

        <CardBody>
          {selectedMaterialsData && (
            <CourseMaterialsManager
              key={selectedMaterialsData.id}
              packageId={selectedMaterialsData.id}
              packageName={selectedMaterialsData.titleEn}
              initialMaterials={selectedMaterialsData.courseMaterials}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
