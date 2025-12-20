import { ChevronLeft, Play, Lock, PlayCircle } from "lucide-react";
import { Accordion, AccordionItem, Chip, cn } from "@heroui/react";
import { useParams } from "next/navigation";

export default function CourseActivity({
  data,
  onSelectVideo,
  currentVideoUrl,
  allowAllSubactivities = false,
}: {
  data: {
    titleEn: string;
    titleAm: string;
    subActivity: {
      id: string;
      titleEn: string;
      titleAm: string;
      isFree?: boolean;
      video?: string | null;
      thumbnail?: string | null;
    }[];
    order?: number;
  }[];
  onSelectVideo?: (
    video: string,
    title: string,
    subActivityId?: string,
    thumbnail?: string
  ) => void;
  currentVideoUrl?: string;
  allowAllSubactivities?: boolean; // If true, all subactivities with videos are clickable (for managers)
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
                    {lang == "en" ? "Module" : "ሞጁል"} {order ?? i + 1}:
                  </span>
                  <span className="break-words">
                    {lang == "en" ? titleEn : titleAm}
                  </span>
                </p>
              }
              indicator={() => (
                <ChevronLeft className="size-5 stroke-primary" />
              )}
              classNames={{ titleWrapper: "overflow-hidden" }}
              className="overflow-hidden shadow-none bg-primary-600/20 border border-primary-600/20 "
            >
              <div className="md:p-5 space-y-2">
                {subActivity.map((sub, subIndex) => {
                  const isFree = sub.isFree ?? false;
                  const hasVideo = !!sub.video;
                  // For managers (allowAllSubactivities=true), all subactivities with videos are clickable
                  // For guests/students, only free subactivities are clickable
                  const isClickable = allowAllSubactivities
                    ? hasVideo && !!onSelectVideo
                    : isFree && hasVideo && !!onSelectVideo;
                  const isCurrentlyPlaying = currentVideoUrl === sub.video;
                  const subTitle = lang == "en" ? sub.titleEn : sub.titleAm;

                  return (
                    <button
                      key={sub.id || subIndex + ""}
                      type="button"
                      onClick={() => {
                        if (isClickable && sub.video && onSelectVideo) {
                          onSelectVideo(
                            sub.video,
                            subTitle,
                            sub.id,
                            sub.thumbnail || undefined
                          );
                        }
                      }}
                      disabled={!isClickable}
                      className={cn(
                        "w-full flex gap-1 md:gap-2 items-center text-left p-2 rounded-lg transition-all",
                        isClickable
                          ? "hover:bg-primary-100 dark:hover:bg-primary-900/30 cursor-pointer"
                          : "cursor-not-allowed opacity-60",
                        isCurrentlyPlaying &&
                          "bg-primary-200 dark:bg-primary-800/50 ring-2 ring-primary-500"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isCurrentlyPlaying ? (
                          <PlayCircle className="size-5 shrink-0 text-primary-600 dark:text-primary-400 animate-pulse" />
                        ) : isClickable ? (
                          <Play className="size-5 shrink-0 text-success-600 dark:text-success-400" />
                        ) : (
                          <Lock className="size-5 shrink-0 text-gray-400" />
                        )}
                        <span
                          className={cn(
                            "overflow-hidden break-words flex-1",
                            isCurrentlyPlaying && "font-bold"
                          )}
                        >
                          {subTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isFree && !allowAllSubactivities && (
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            className="text-xs"
                          >
                            {lang == "en" ? "Free" : "ነፃ"}
                          </Chip>
                        )}
                        {isCurrentlyPlaying && (
                          <Chip
                            size="sm"
                            color="primary"
                            variant="flat"
                            className="text-xs"
                          >
                            {lang == "en" ? "Playing" : "በመጫወት ላይ"}
                          </Chip>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 max-md:flex-col-reverse md:justify-end"></div>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}
