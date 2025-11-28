import { ChevronLeft, Play } from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/react";
import { useParams } from "next/navigation";

export default function CourseActivity({
  data,
}: {
  data: {
    titleEn: string;
    titleAm: string;
    subActivity: { id: string; titleEn: string; titleAm: string }[];
    order?: number;
  }[];
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  return (
    <div className="">
      <p className="pb-2 md:text-2xl font-extrabold ">
        {lang == "en" ? "What you will learn" : "ምን ይማራሉ"}
      </p>
      <Accordion variant="splitted" isCompact className="p-0 ">
        {[...data]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(({ titleEn, titleAm, subActivity, order }, i) => (
          <AccordionItem
            key={i + ""}
            aria-label={titleEn}
            title={
              <p className="">
                <span className="pr-2 font-bold whitespace-nowrap">
                  {lang == "en" ? "Module" : "ሞጁል"} {(order ?? i + 1)}:
                </span>
                <span className="break-words">
                  {lang == "en" ? titleEn : titleAm}
                </span>
              </p>
            }
            indicator={() => <ChevronLeft className="size-5 stroke-primary" />}
            classNames={{ titleWrapper: "overflow-hidden" }}
            className="overflow-hidden shadow-none bg-primary-600/20 border border-primary-600/20 "
          >
            <div className="md:p-5 space-y-2">
              {subActivity.map((sub, i) => (
                <div key={i + ""} className="flex gap-1 md:gap-2 items-center">
                  <Play className="size-5 shrink-0 " />
                  <span className="overflow-hidden break-words ">
                    {lang == "en" ? sub.titleEn : sub.titleAm}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-md:flex-col-reverse md:justify-end"></div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
