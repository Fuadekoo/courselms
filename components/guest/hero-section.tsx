"use client";

import { Button, Chip } from "@heroui/react";
import { ArrowRight, BookOpen, Users, Globe, Star, GraduationCap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const HERO_CONTENT = {
  en: {
    badge: "Join 10,000+ students worldwide",
    titlePrimary: "Master Islamic Studies",
    titleSecondary: "From the Comfort of Home",
    description: "Connect with distinguished international scholars. Access structured courses in Quranic Sciences, Arabic Language, Jurisprudence (Fiqh), and Hadith—all through a modern digital learning experience.",
    ctaPrimary: "Start Your Journey",
    ctaSecondary: "Explore Courses",
    stats: [
      { label: "Active Students", value: "10K+", icon: Users },
      { label: "Expert Scholars", value: "100+", icon: GraduationCap },
      { label: "Satisfaction", value: "98%", icon: Star },
      { label: "Countries", value: "35+", icon: Globe },
    ]
  },
  am: {
    badge: "ከ10,000+ በላይ ንቁ ተማሪዎችን ይቀላቀሉ",
    titlePrimary: "የእስልምና እውቀትዎን ያዳብሩ",
    titleSecondary: "ከቤትዎ ሳይወጡ ይማሩ",
    description: "ከታዋቂ ዓለም አቀፍ ምሁራን ጋር በመገናኘት የቁርአን ንባብን፣ የአረብኛ ቋንቋን፣ ፊቅህንና ሀዲስን በዘመናዊ መንገድ ይማሩ። ጥራትና ትክክለኛነትን የጠበቁ ኮርሶችን ለናንተ አዘጋጅተናል።",
    ctaPrimary: "አሁኑኑ ይጀምሩ",
    ctaSecondary: "ኮርሶችን ይመልከቱ",
    stats: [
      { label: "ንቁ ተማሪዎች", value: "10ሺ+", icon: Users },
      { label: "ሊቃውንት", value: "100+", icon: GraduationCap },
      { label: "እርካታ", value: "98%", icon: Star },
      { label: "አገራት", value: "35+", icon: Globe },
    ]
  }
};

export function HeroSection() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as "en" | "am") || "en";
  const t = HERO_CONTENT[lang] || HERO_CONTENT.en;

  const handleStartJourney = () => router.push(`/${lang}/signup`);
  
  const handleExploreCourses = () => {
    const coursesSection = document.getElementById("courses");
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(`/${lang}/course`);
    }
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 bg-transparent">
  {/* Background Decorative Element - Reduced opacity to not clash with logo */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none opacity-10 dark:opacity-5">
    <div className="absolute top-0 left-0 w-72 h-72 bg-primary rounded-full blur-[120px]" />
    <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary rounded-full blur-[120px]" />
  </div>

  <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <Chip 
            variant="dot" 
            color="primary" 
            className="mb-8 px-4 py-2 border-primary/20 bg-background/50 backdrop-blur-md animate-appearance-in"
          >
            {t.badge}
          </Chip>

          <h1 className="mb-8 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl text-foreground">
            {t.titlePrimary}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
              {t.titleSecondary}
            </span>
          </h1>

          <p className="mb-12 text-lg text-default-500 md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-24">
            <Button
              size="lg"
              color="primary"
              className="text-lg px-10 h-16 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              endContent={<ArrowRight className="h-5 w-5" />}
              onPress={handleStartJourney}
            >
              {t.ctaPrimary}
            </Button>
            <Button
              size="lg"
              variant="bordered"
              className="text-lg px-10 h-16 font-bold border-2 hover:bg-default-100 transition-all"
              startContent={<BookOpen className="h-5 w-5" />}
              onPress={handleExploreCourses}
            >
              {t.ctaSecondary}
            </Button>
          </div>

          {/* Stats Section with Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-8 rounded-3xl bg-background/40 dark:bg-default-50/5 border border-divider/50 backdrop-blur-md shadow-2xl">
            {t.stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex flex-col items-center group">
                  <div className="mb-2 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                    <Icon size={20} />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wider text-default-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}