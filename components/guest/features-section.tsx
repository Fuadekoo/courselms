"use client";
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  Video,
} from "lucide-react";
import { useParams } from "next/navigation";

const CONTENT = {
  en: {
    badge: "Excellence in Islamic Education",
    title: "Why Choose Darulkubra",
    description: "Merging authentic Islamic scholarship with modern pedagogical technology to provide a world-class learning experience.",
    features: [
      {
        icon: BookOpen,
        title: "Comprehensive Curriculum",
        desc: "A meticulously designed syllabus covering Quranic sciences, Tajweed, and foundational Islamic studies.",
      },
      {
        icon: GraduationCap,
        title: "Qualified Faculty",
        desc: "Learn from certified scholars and educators with proven expertise in classical and contemporary instruction.",
      },
      {
        icon: Clock,
        title: "Adaptive Learning",
        desc: "Flexible scheduling designed to integrate seamlessly into your professional and personal life.",
      },
      {
        icon: Award,
        title: "Accredited Certification",
        desc: "Earn formal recognition and certificates upon the successful completion of each academic level.",
      },
      {
        icon: Video,
        title: "Interactive Support",
        desc: "Direct access to instructors through live sessions for personalized guidance and academic clarity.",
      },
    ],
  },
  am: {
    badge: "ጥራት ያለው የእስልምና ትምህርት",
    title: "ዳሩልኩብራን ለምን ይመርጣሉ?",
    description: "ትክክለኛውን የእስልምና እውቀት ከዘመናዊ የመማሪያ ቴክኖሎጂ ጋር በማቀናጀት ዓለም አቀፍ ደረጃውን የጠበቀ ትምህርት እናቀርባለን።",
    features: [
      {
        icon: BookOpen,
        title: "ሁሉን አቀፍ ስርዓተ-ትምህርት",
        desc: "የቁርአን ሳይንስን፣ ተጅዊድንና መሰረታዊ የእስልምና ትምህርቶችን ያካተተ ጥንቁቅ ዝግጅት።",
      },
      {
        icon: GraduationCap,
        title: "ብቁ መምህራን",
        desc: "በዘርፉ የላቀ እውቀትና የማስተማር ልምድ ካላቸው እውቅና ካገኙ መምህራን ይማሩ።",
      },
      {
        icon: Clock,
        title: "ተለዋዋጭ የመማሪያ ጊዜ",
        desc: "ከእለት ተእለት ስራዎ ጋር በሚጣጣም መልኩ በራስዎ ፍጥነት እንዲማሩ ታስቦ የተዘጋጀ።",
      },
      {
        icon: Award,
        title: "ህጋዊ የምስክር ወረቀት",
        desc: "እያንዳንዱን የትምህርት ደረጃ ሲያጠናቅቁ የተቋሙን ይፋዊ እውቅና እና የምስክር ወረቀት ያግኙ።",
      },
      {
        icon: Video,
        title: "የቀጥታ ድጋፍ",
        desc: "ለጥያቄዎችዎ እና ለተጨማሪ ማብራሪያ ከመምህራን ጋር በቀጥታ የሚገናኙበት የቪዲዮ ድጋፍ።",
      },
    ],
  },
};

export function FeaturesSection() {
  const params = useParams();
  const lang = (params?.lang as "en" | "am") || "en";
  const t = CONTENT[lang] || CONTENT.en;

  return (
    <section
      id="features"
      className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-primary-50/20 to-background dark:via-primary-950/10"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <p className="text-sm font-bold tracking-widest uppercase text-primary mb-4">
            {t.badge}
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground">
            {t.title}
          </h2>
          <p className="text-default-500 max-w-3xl mx-auto text-lg leading-relaxed">
            {t.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {t.features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group p-4 border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-background/60 dark:bg-default-50/50 backdrop-blur-md border border-divider/50 hover:-translate-y-2"
              >
                <CardHeader className="flex-col items-start gap-4">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 shadow-inner">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardBody className="py-2">
                  <p className="text-default-600 text-base leading-relaxed">
                    {feature.desc}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}