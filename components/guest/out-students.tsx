"use client";
import { Card, CardBody, User } from "@heroui/react";
import { Star, Quote } from "lucide-react";
import { useParams } from "next/navigation";

const TESTIMONIAL_CONTENT = {
  en: {
    title: "Voices of Our Community",
    badge: "Student Testimonials",
    description: "Discover how Darulkubra is transforming the lives of students across the globe through accessible Islamic education.",
  },
  am: {
    title: "የተማሪዎቻችን ምስክርነት",
    badge: "ከተማሪዎቻችን አንደበት",
    description: "ዳሩልኩብራ በዓለም ዙሪያ የሚገኙ ሙስሊሞችን ህይወት በዕውቀት እንዴት እየቀየረ እንደሚገኝ ከተማሪዎቻችን ይስሙ።",
  }
};

const getOurStudents = (lang: string) => [
  {
    name: "Fatima Abdurrahman",
    role: lang === "en" ? "Hifz Student | Saudi Arabia" : "የሂፍዝ ተማሪ | ሳውዲ አረቢያ",
    content:
      lang === "en"
        ? "Masha'Allah, this course has been a blessing! Despite my busy schedule, the structured videos and live sessions made it possible for me to finally begin my Quran journey. The Qai'da app is a game changer. Alhamdulillah!"
        : "ማሻአሏህ፣ ይህ ትምህርት ለእኔ ትልቅ ጸጋ ነው! የጊዜ ጥብቅነት ቢኖርብኝም፣ የተቀነባበሩ ቪዲዮዎችና የቀጥታ ስርጭት ትምህርቶች የቁርአን ጉዞዬን እንድጀምር ረድተውኛል። አልሐምዱሊላህ!",
    rating: 5,
    initials: "FA",
  },
  {
    name: "Sualihat",
    role: lang === "en" ? "Tajweed Student | UK" : "የታጅዊድ ተማሪ | እንግሊዝ",
    content:
      lang === "en"
        ? "The instructors are incredibly thorough. They use multiple teaching methods that cater to all learning styles. I've learned that consistency and note-taking are key. May Allah reward the team!"
        : "አስተማሪዎቹ በጣም ጥንቁቆች ናቸው። ሁሉንም የመማር ዘይቤዎች ባገናዘበ መልኩ በተለያዩ ዘዴዎች ያስተምራሉ። ትጋትና ማስታወሻ መያዝ ለውጤት ቁልፍ መሆናቸውን ተምሬያለሁ። አሏህ ይክፈላችሁ!",
    rating: 5,
    initials: "S",
  },
  {
    name: "Siraj Seid",
    role: lang === "en" ? "Islamic Studies | Canada" : "የእስልምና ጥናት ተማሪ | ካናዳ",
    content:
      lang === "en"
        ? "The presentation is remarkably clear and engaging. The platform is user-friendly and removes the complexity often found in online learning. Highly recommended for brothers and sisters abroad."
        : "አቀራረቡ በጣም ግልጽና ሳቢ ነው። መድረኩ ለመጠቀም ቀላልና እንደ ሌሎች የኦንላይን ትምህርቶች የማይወሳሰብ ነው። በውጭ ለምትኖሩ እህት ወንድሞች በጣም ይመከራል።",
    rating: 5,
    initials: "SS",
  },
  {
    name: "Rediwan",
    role: lang === "en" ? "Student | Somalia" : "ተማሪ | ሶማሊያ",
    content:
      lang === "en"
        ? "Alhamdulillah, the quality of instruction is world-class. Even with a demanding work schedule, I can access the lessons whenever I'm free. Looking forward to completing the next level!"
        : "አልሐምዱሊላህ፣ የትምህርቱ ጥራት እጅግ በጣም ከፍተኛ ነው። በስራ ብዚ ብሆንም፣ አመቺ በሆነኝ ጊዜ ትምህርቱን መከታተል መቻሌ ትልቅ ዕድል ነው። የሚቀጥለውን ደረጃ ለመጀመር ጓጉቻለሁ!",
    rating: 5,
    initials: "R",
  },
];

export function OurStudentsSection() {
  const params = useParams();
  const lang = (params?.lang as "en" | "am") || "en";
  const t = TESTIMONIAL_CONTENT[lang] || TESTIMONIAL_CONTENT.en;
  const ourStudents = getOurStudents(lang);

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-background via-primary-50/10 to-background dark:via-primary-950/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Chip color="primary" variant="flat" className="mb-4 font-bold uppercase tracking-widest text-xs">
            {t.badge}
          </Chip>
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            {t.title}
          </h2>
          <p className="text-default-500 max-w-2xl mx-auto text-lg leading-relaxed">
            {t.description}
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {ourStudents.map((student, index) => (
            <Card
              key={index}
              className="break-inside-avoid bg-background/60 dark:bg-default-50/5 backdrop-blur-md border border-divider/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <CardBody className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-0.5">
                    {[...Array(student.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <Quote className="text-primary/20 rotate-180" size={32} />
                </div>

                <p className="text-default-700 mb-8 text-lg leading-relaxed font-medium italic">
                  &quot;{student.content}&quot;
                </p>

                <div className="flex items-center gap-3 border-t border-divider pt-6">
                   <User
                    name={student.name}
                    description={student.role}
                    avatarProps={{
                      name: student.initials,
                      color: "primary",
                      isBordered: true,
                      className: "text-tiny"
                    }}
                    classNames={{
                      name: "font-bold text-foreground",
                      description: "text-primary text-xs font-medium"
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
import { Chip } from "@heroui/react";