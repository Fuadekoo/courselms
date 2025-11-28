import React from "react";
import { auth } from "@/lib/auth";
import { BookOpen, CheckCircle, Award } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import StatCard from "@/components/ui/StatCard";
import {
  getDashboardData,
  getGraphData,
  getContinueLearning,
} from "@/actions/student/dashboard";
import DashboardChart from "./components/DashboardChart";
import ContinueLearningList from "./components/ContinueLearningList";
import { getUserName } from "@/actions/user/header";

async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();
  const userName = await getUserName();

  // Fetch all dashboard data
  const [dashboardStats, graphData, continueLearning] = await Promise.all([
    getDashboardData(),
    getGraphData(),
    getContinueLearning(),
  ]);

  // Default values if data fetch fails
  const stats = dashboardStats || {
    totalCourses: 0,
    coursesInProgress: 0,
    completedCourses: 0,
    certificatesEarned: 0,
  };

  const chartData =
    graphData?.map((course) => ({
      name:
        (lang === "en" ? course.titleEn : course.titleAm).substring(0, 15) +
        ((lang === "en" ? course.titleEn : course.titleAm).length > 15
          ? "..."
          : ""),
      Progress: course.progress,
    })) || [];

  const continueList = continueLearning || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          userName
            ? `${lang === "en" ? "Aselamualekum" : "አሰላም አለይኩም"} ${userName}`
            : lang === "en"
            ? "Aselamualekum"
            : "አሰላም አለይኩም"
        }
        subtitle={
          lang === "en"
            ? "Let's continue your learning journey."
            : "የመማር ድረስ እንቀጥል።"
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<BookOpen className="size-6" />}
          label={lang === "en" ? "Courses in Progress" : "በሂደት ላይ ያሉ ኮርሶች"}
          value={stats.coursesInProgress}
        />
        <StatCard
          icon={<CheckCircle className="size-6" />}
          label={lang === "en" ? "Completed Courses" : "የተጠናቀቁ ኮርሶች"}
          value={stats.completedCourses}
        />
        <StatCard
          icon={<Award className="size-6" />}
          label={lang === "en" ? "Certificates Earned" : "የተገኙ የምስክር ወረቀቶች"}
          value={stats.certificatesEarned}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress Chart */}
        <Section
          title={lang === "en" ? "Course Progress" : "የኮርስ ሂደት"}
          className="lg:col-span-2"
        >
          <DashboardChart data={chartData} />
        </Section>

        {/* Continue Learning */}
        <Section
          title={lang === "en" ? "Continue Learning" : "መማርዎን ይቀጥሉ"}
          description={
            lang === "en" ? "Pick up where you left off" : "ያቆሙበትን ቦታ ይቀጥሉ"
          }
        >
          <ContinueLearningList courses={continueList} lang={lang} />
        </Section>
      </div>
    </div>
  );
}

export default Page;
