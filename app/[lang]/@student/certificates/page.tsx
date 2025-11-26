"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardBody, Button, Image } from "@heroui/react";
import { Award, ExternalLink } from "lucide-react";
import Loading from "@/components/loading";
import NoData from "@/components/noData";
import { getAllCertificates } from "@/actions/student/mycourse";
import useData from "@/hooks/useData";

export default function CertificatesPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const {
    data: certificates,
    loading,
    error,
  } = useData({
    func: getAllCertificates,
    args: [],
  });

  const handleViewCertificate = (courseId: string) => {
    router.push(`/${lang}/certificates/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-6">
            <p className="text-red-500">
              Failed to load certificates. Please try again.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent mb-2">
              My Certificates
            </h1>
            <p className="text-muted-foreground">
              View and download your course completion certificates
            </p>
          </div>
          <NoData message="Complete courses and pass final exams to earn certificates." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              My Certificates
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            You have earned {certificates.length} certificate
            {certificates.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {certificates.map(
            (cert: {
              courseId: string;
              courseTitle: string;
              thumbnail: string | null;
              instructorName: string;
              issuedAt: string;
            }) => (
              <Card
                key={cert.courseId}
                className="hover:shadow-lg transition-shadow duration-300"
                isPressable
                onPress={() => handleViewCertificate(cert.courseId)}
              >
                <CardBody className="p-4 sm:p-6">
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                    {cert.thumbnail ? (
                      <Image
                        src={cert.thumbnail}
                        alt={cert.courseTitle}
                        className="w-full h-full object-cover"
                        width={400}
                        height={225}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    {/* Certificate Badge */}
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Certificate
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {cert.courseTitle}
                  </h3>

                  {/* Instructor */}
                  <p className="text-sm text-muted-foreground mb-4">
                    Instructor: {cert.instructorName}
                  </p>

                  {/* Issued Date */}
                  <p className="text-xs text-muted-foreground mb-4">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>

                  {/* View Certificate Button */}
                  <Button
                    color="primary"
                    variant="solid"
                    className="w-full"
                    endContent={<ExternalLink className="w-4 h-4" />}
                    onPress={() => handleViewCertificate(cert.courseId)}
                  >
                    View Certificate
                  </Button>
                </CardBody>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
