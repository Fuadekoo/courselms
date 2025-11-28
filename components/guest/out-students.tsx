"use client";
import { Card, CardBody } from "@heroui/react";
import { Star } from "lucide-react";
import { useParams } from "next/navigation";

const getOurStudents = (lang: string) => [
  {
    name: "Fatima Abdurrahman",
    role: lang === "en" ? "Hifz Student from Saudi" : "ከሳውድያ የሂፍዝ ተማሪ",
    content:
      lang === "en"
        ? "Masha'Allah, this lesson has been extremely beneficial and useful! Despite my tight schedule, the resources—including the videos, live lessons, and the Qai'da application—made it possible for me to start the Quran and learn to read. Everything provided has truly helped me. Alhamdulillah!"
        : "ማሻአሏህ፣ ይህ ትምህርት እጅጉን ጠቃሚ እና ምቹ ነበር! ጠባብ የጊዜ ሰሌዳዬ ቢኖርም፣ ቪዲዮዎች፣ ቀጥታ ትምህርቶች እና የቃዒዳ መተግበሪያ ጨምሮ ያሉት ሀብቶች ቁርአንን ለመጀመር እና ለመንባብ ለመማር አስቻሉኝ። የተሰጠው ሁሉ በእውነት ረድቶኛል። አልሐምዱሊላህ!",
    rating: 5,
  },
  {
    name: "Sualihat",
    role: lang === "en" ? "Tajweed Student from UK" : "ከእንግሊዝ የታጅዊድ ተማሪ",
    content:
      lang === "en"
        ? "Masha'Allah, I don't blame the instructors for any of my shortcomings—they haven't held back anything! They taught with videos, live sessions, and three key methods. The content is excellent; I've learned that writing things down is key to retention. May Allah increase you!"
        : "ማሻአሏህ፣ አስተማሪዎቹን ለማንኛውም የእኔ ጉድለት አልከሰስም—ምንም ነገር አልደበቁም! በቪዲዮዎች፣ ቀጥታ ክፍለ ጊዜያት እና ሦስት ዋና ዘዴዎች አስተምረዋል። ይዘቱ በጣም ጥሩ ነው፤ ነገሮችን መጻፍ ለመቆጣጠር ቁልፍ እንደሆነ ተማርኩ። አሏህ ያበዛችሁ!",
    rating: 3,
  },
  {
    name: "Siraj Seid",
    role: lang === "en" ? "Student from Canada" : "ከካናዳ ተማሪ",
    content:
      lang === "en"
        ? "Masha'Allah, your presentation is very clear and pleasing! It is great, and there is nothing complicated about the way things are done. May Allah make it easy for us, Insha'Allah."
        : "ማሻአሏህ፣ የእናንተ አቀራረብ በጣም ግልጽ እና አስደሳች ነው! በጣም ጥሩ ነው፣ እና ነገሮች እንዴት እንደሚደረጉ ምንም የተወሳሰበ ነገር የለም። አሏህ ለእኛ ያቀላቅልልን፣ ኢንሻአሏህ።",
    rating: 4,
  },
  {
    name: "Aduneya",
    role: lang === "en" ? "Student from Australia" : "ከአውስትራሊያ ተማሪ",
    content:
      lang === "en"
        ? "had to pause the course due to work and travel in areas with poor connection. It's a great course, and I'm eager to resume."
        : "በስራ እና በደከመ ግንኙነት ባላቸው አካባቢዎች በመጓዝ ምክንያት ኮርሱን ማቆም ነበረብኝ። በጣም ጥሩ ኮርስ ነው፣ እና መቀጠል እመኝራለሁ።",
    rating: 4,
  },
  {
    name: "Rediwan",
    role: lang === "en" ? "Student from Somalia" : "ከሶማሊያ ተማሪ",
    content:
      lang === "en"
        ? "Alhamdulillah. I have been checking the lessons from time to time, and it is great—very good so far! I am looking forward to doing more as soon as my work schedule allows"
        : "አልሐምዱሊላህ። ትምህርቶቹን ከጊዜ ወደ ጊዜ እየፈተንኩ ነው፣ እና በጣም ጥሩ ነው—እስካሁን በጣም ጥሩ! የስራ ሰሌዳዬ እንዲፈቅድ ብዙ ማድረግ እመኝራለሁ",
    rating: 5,
  },
  {
    name: "Biniyam",
    role: lang === "en" ? "Student from Ethiopia" : "ከኢትዮጵያ ተማሪ",
    content:
      lang === "en"
        ? "The course is excellent,"
        : "ኮርሱ በጣም ጥሩ ነው፣",
    rating: 5,
  },
];

export function OurStudentsSection() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const ourStudents = getOurStudents(lang);

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">
            {lang === "en"
              ? "what our students say about us !"
              : "ተማሪዎቻችን ስለእኛ ምን ይላሉ!"}
          </h2>
          <p className="text-lg font-semibold text-primary mb-2">
            {lang === "en"
              ? "Our students are our best ambassadors"
              : "ተማሪዎቻችን ምርጥ ወኪሎቻችን ናቸው"}
          </p>
          <p className="text-default-600 max-w-2xl mx-auto">
            {lang === "en"
              ? "Our students are our best ambassadors and they are happy with our services"
              : "ተማሪዎቻችን ምርጥ ወኪሎቻችን ናቸው እና ከአገልግሎቶቻችን ደስ ይላቸዋል"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ourStudents.map((student, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow bg-background border border-divider"
            >
              <CardBody className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(student.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-default-600 mb-6 italic">
                  &quot;{student.content}&quot;
                </p>
                <div className="border-t border-divider pt-4">
                  <p className="font-semibold text-foreground">
                    {student.name} <span className="text-sm text-default-600">{student.role}</span>
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
