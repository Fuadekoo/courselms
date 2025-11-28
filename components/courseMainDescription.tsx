import { cn } from "@/lib/utils";
import { Button } from "@heroui/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function CourseMainDescription({
  data,
  btn,
}: {
  data: {
    icon: React.ReactNode;
    label: string;
    value: string | number | boolean | React.ReactNode;
  }[];
  btn?: React.ReactNode;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "";
  const searchParams = useSearchParams();

  return (
    <div className="md:fixed md:top-16 md:right-4 lg:right-6 xl:right-8 md:w-72 2xl:w-80 p-4 rounded-xl border border-blue-600/20 md:divide-y divide-primary-600/20 bg-background md:max-h-[calc(100vh-4rem)] md:overflow-y-auto smooth-scroll">
      {btn && (
        <div className={cn("z-20 md:pb-4 grid gap-2 ")}>
          <Button
            isIconOnly
            variant="flat"
            color="primary"
            as={Link}
            href={`/${lang}/course?code=${searchParams?.get("code") || ""}`}
            className="md: hidden "
          >
            <ChevronLeft className="size-5" />
          </Button>
          {btn}
        </div>
      )}
      <div className="py-4 space-y-4">
        {data.map(({ icon, label, value }, i) => (
          <div key={i + ""} className="flex gap-2 items-start">
            {icon}
            <div className="flex-1">
              {label && (
                <span className="text-sm text-default-600">
                  {label} {label && ":"}
                </span>
              )}
              <div className={label ? "mt-1" : ""}>
                {typeof value === "object" &&
                value !== null &&
                "$$typeof" in value
                  ? value
                  : typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean"
                  ? value
                  : String(value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
