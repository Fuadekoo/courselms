"use client";
import { Card, CardBody } from "@heroui/react";
import { Star } from "lucide-react";
import { useParams } from "next/navigation";

const getTestimonials = (lang: string) => [
  {
    name: "Aisha Rahman",
    role: lang === "en" ? "Hifz Student from USA" : "ከአሜሪካ የሂፍዝ ተማሪ",
    content:
      lang === "en"
        ? "The structured approach and patient teachers helped me memorize 5 Juz in just 8 months. The revision system keeps everything fresh in my memory. Alhamdulillah!"
        : "የተዋቀረው አቀራረብ እና ታጋሽ አስተማሪዎች 5 ጁዝን በ8 ወራት ውስጥ ለማስታወስ ረዱኝ። የግምገማ ስርዓቱ ሁሉንም ነገር በማስታወሻዬ ውስጥ ትኩስ ይይዛል። አልሐምዱሊላህ!",
    rating: 5,
  },
  {
    name: "Muhammad Ali",
    role: lang === "en" ? "Tajweed Student from UK" : "ከእንግሊዝ የታጅዊድ ተማሪ",
    content:
      lang === "en"
        ? "My Tajweed improved significantly. The one-on-one sessions with personalized feedback are incredibly effective. I can now recite with confidence."
        : "ታጅዊዴዬ በእጅጉ ተሻሽሏል። ከግላዊ ግብረመልስ ጋር ያሉት አንድ-በ-አንድ ክፍለ ጊዜያት እጅጉን ውጤታማ ናቸው። አሁን በእምነት ማንበብ እችላለሁ።",
    rating: 5,
  },
  {
    name: "Fatima Yusuf",
    role: lang === "en" ? "Working Professional from Canada" : "ከካናዳ የሚሰራ ባለሙያ",
    content:
      lang === "en"
        ? "Flexible timing allowed me to balance my career and learning. The quality of instruction is exceptional. Best decision I made this year!"
        : "መለዋወጫ የጊዜ ሰሌዳ ስራዬን እና ትምህርቴን ለማመዛዘን ረድቶኛል። የትምህርት ጥራት ልዩ ነው። በዚህ ዓመት የወሰንኩት ምርጥ ውሳኔ!",
    rating: 5,
  },
  {
    name: "Omar Hassan",
    role: lang === "en" ? "Arabic Student from Australia" : "ከአውስትራሊያ የዐረብኛ ተማሪ",
    content:
      lang === "en"
        ? "Learning Quranic Arabic has transformed my understanding of the Quran. The instructors make complex grammar simple and enjoyable."
        : "የቁርአን ዐረብኛ መማር የቁርአንን ግንዛቤዬን ቀይሯል። አስተማሪዎቹ የተወሳሰቡ ሰዋሰውያን ቀላል እና አስደሳች ያደርጉታል።",
    rating: 5,
  },
  {
    name: "Maryam Ahmed",
    role: lang === "en" ? "Fiqh Student from Malaysia" : "ከማሌዢያ የፊቅህ ተማሪ",
    content:
      lang === "en"
        ? "The Islamic jurisprudence course answered so many questions I had. The scholars are knowledgeable and approachable."
        : "የእስላም ሕግ ኮርሱ ያላቸውን ብዙ ጥያቄዎች መለሰልኝ። ምሁራኑ የተማሩ እና ቀርበዋል።",
    rating: 5,
  },
  {
    name: "Ibrahim Khan",
    role: lang === "en" ? "Parent from UAE" : "ከUAE ወላጅ",
    content:
      lang === "en"
        ? "Both my children are enrolled and loving their classes. The platform is safe, professional, and the progress tracking is excellent!"
        : "ሁለቱም ልጆቼ ተመዝግበዋል እና ክፍሎቻቸውን ይወዳሉ። መድረኩ ደህንነቱ የተጠበቀ፣ ባለሙያ እና የእድገት መከታተያው በጣም ጥሩ ነው!",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const testimonials = getTestimonials(lang);

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">
            {lang === "en" ? "Testimonials" : "መመስከሪያዎች"}
          </h2>
          <p className="text-lg font-semibold text-primary mb-2">
            {lang === "en"
              ? "Transforming Lives Through Islamic Education"
              : "በእስላም ትምህርት ሕይወቶችን ማለወጥ"}
          </p>
          <p className="text-default-600 max-w-2xl mx-auto">
            {lang === "en"
              ? "Join thousands of students who have transformed their relationship with Islamic knowledge"
              : "ከእስላም እውቀት ጋር ያላቸውን ግንኙነት የቀየሩ በሺዎች የሚቆጠሩ ተማሪዎች ይቀላቀሉ"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow bg-background border border-divider"
            >
              <CardBody className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-default-600 mb-6 italic">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="border-t border-divider pt-4">
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-default-600">{testimonial.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
