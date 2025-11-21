/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import useData from "@/hooks/useData";
import Loading from "@/components/loading";

import {
  Button,
  Form,
  Input,
  Checkbox,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendMessageToAll } from "@/lib/action/message";
import { getCourses } from "@/lib/data/course";
import useAction from "@/hooks/useAction";
import { AlertTriangle, Link2, Send, Smartphone, Users, Calendar, MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { addAnnouncement, getAnnouncements } from "@/lib/data/courseMaterials";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import PageHeader from "@/components/layout/PageHeader";

const formSchema = z.object({
  courseId: z.array(z.string({ message: "" })),
  message: z.string({ message: "" }).nonempty("Message is required"),
  withUrl: z.coerce.boolean({ message: "" }).optional(),
  url: z.string({ message: "" }).optional(),
  name: z.string({ message: "" }).optional(),
  withSMS: z.coerce.boolean({ message: "" }),
  targetAll: z.coerce.boolean({ message: "" }).optional(),
});

interface AnnouncementItem {
  id: string;
  anouncementDescription: string;
  createdAt: Date;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  // Broadcast form
  const { handleSubmit, register, watch, formState, setValue } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      url: "",
      name: "",
      withSMS: false,
      withUrl: false,
      targetAll: false,
      courseId: [],
    },
  });

  const { data: courses, loading } = useData({ func: getCourses, args: [] });

  const { action, isPending } = useAction(sendMessageToAll, undefined, {
    loading: lang === "en" ? "Sending..." : "በመላክ ላይ...",
    success: lang === "en" ? "Message sent successfully" : "መልዕክት ተልኳል",
    error: lang === "en" ? "Failed to send message" : "መልዕክት ማስተላለፍ አልተሳካም",
  });

  const withUrlValue = watch("withUrl");
  const targetAll = watch("targetAll");
  const selectedCourseIds = watch("courseId");
  const messageText = watch("message") ?? "";

  const allCourseIds = useMemo(
    () => (courses ?? []).map((c: any) => c.id),
    [courses]
  );

  const selectedCount = useMemo(
    () => (targetAll ? allCourseIds.length : selectedCourseIds.length || 0),
    [targetAll, allCourseIds.length, selectedCourseIds.length]
  );

  const disabledSubmit = useMemo(() => {
    if (isPending || loading) return true;
    if (!messageText.trim()) return true;
    if (!targetAll && selectedCourseIds.length === 0) return true;
    if (withUrlValue && !watch("url")?.trim()) return true;
    return false;
  }, [isPending, loading, messageText, targetAll, selectedCourseIds.length, withUrlValue, watch]);

  const onSubmit = async (payload: z.infer<typeof formSchema>) => {
    const finalPayload = {
      ...payload,
      courseId: payload.targetAll ? allCourseIds : payload.courseId,
    };

    if (!finalPayload.courseId || finalPayload.courseId.length === 0) return;

    const confirmText = `${lang === "en" ? "Send this message to" : "ይህን መልዕክት ለ"} ${selectedCount} ${
      lang === "en" ? "course(s) enrolled students?" : "ኮርሶች የተመዘገቡ ተማሪዎች?"
    }${payload.withSMS ? `\n${lang === "en" ? "SMS will also be sent." : "ኤስኤምኤስ ደግሞ ይላካል።"}` : ""}`;
    const proceed = window.confirm(confirmText);
    if (!proceed) return;

    await action(finalPayload);
  };

  // Announcements state
  const [announcementCourseId, setAnnouncementCourseId] = useState<string>("");
  useEffect(() => {
    if (!announcementCourseId && courses && courses.length > 0) {
      setAnnouncementCourseId(courses[0].id);
    }
  }, [courses, announcementCourseId]);

  const { data: announcements, loading: loadingAnnouncements, refresh: refreshAnnouncements } = useData({
    func: getAnnouncements,
    args: [announcementCourseId || ""],
  });

  const [announcementText, setAnnouncementText] = useState("");

  const { action: createAnnouncement, isPending: creatingAnnouncement } = useAction(
    async (
      prev: any,
      payload: { courseId: string; description: string } | undefined
    ) => {
      if (!payload?.courseId || !payload.description?.trim()) {
        return { status: false, cause: "invalid", message: "Invalid payload" } as any;
      }
      const res = await addAnnouncement(payload.courseId, payload.description);
      return { status: res.success, cause: "", message: "" } as any;
    },
    undefined,
    {
      loading: lang === "en" ? "Publishing..." : "በመለጠፍ ላይ...",
      success: lang === "en" ? "Announcement published" : "ማሳወቂያ ተለጥፏል",
      error: lang === "en" ? "Failed to publish" : "ማሳወቂያ ማስረት አልተሳካም",
      onSuccess: () => {
        setAnnouncementText("");
        refreshAnnouncements();
      },
    }
  );

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementCourseId || !announcementText.trim()) return;
    await createAnnouncement({ courseId: announcementCourseId, description: announcementText.trim() });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <ScrollablePageWrapper>
      <PageHeader
        title={lang === "en" ? "Communications" : "መግቢያዎች"}
        subtitle={lang === "en"
          ? "Broadcast messages to students and manage course announcements in one place."
          : "መልዕክቶችን ይላኩ እና የኮርስ ማሳወቂያዎችን በአንድ ገጽ ያስተዳድሩ።"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form Card */}
        <div className="lg:col-span-2">
          <Form
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 space-y-6"
            validationErrors={Object.entries(formState.errors).reduce(
              (a, [key, value]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return { ...a, [key]: (value as any).message };
              },
              {}
            )}
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Audience */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-medium">{lang === "en" ? "Audience" : "ተቀባዮች"}</h2>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={targetAll} {...register("targetAll")}>
                  {lang === "en" ? "Send to all courses" : "ለሁሉም ኮርሶች ላክ"}
                </Checkbox>
              </div>
              <div className="pt-2">
                <Select
                  className="max-w-full"
                  label={lang === "en" ? "Select Courses" : "ኮርሶች ይምረጡ"}
                  placeholder={
                    lang === "en" ? "Choose one or more courses" : "አንድ ወይም ብዙ ኮርሶች ይምረጡ"
                  }
                  selectionMode="multiple"
                  isDisabled={targetAll}
                  onSelectionChange={(data) => {
                    setValue("courseId", Array.from(data) as string[]);
                  }}
                >
                  {(courses ?? []).map((course: any) => (
                    <SelectItem key={course.id}>{course.titleEn}</SelectItem>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {lang === "en"
                    ? `Selected: ${selectedCount} course(s)`
                    : `ተመርጧል፡ ${selectedCount} ኮርሶች`}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-medium">{lang === "en" ? "Message" : "መልዕክት"}</h2>
              </div>
              <Textarea
                {...register("message")}
                placeholder={
                  lang === "en"
                    ? "Type your announcement or update here..."
                    : "መልዕክትዎን እዚህ ያስገቡ..."
                }
                minRows={5}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {lang === "en"
                    ? "If SMS is enabled, it will be delivered to enrolled students."
                    : "ኤስኤምኤስ ካነቃቸ ለተመዘገቡ ተማሪዎች ይላካል።"}
                </span>
                <span>
                  {messageText.length} {lang === "en" ? "characters" : "ፊደላት"}
                </span>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700" />

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <Checkbox {...register("withSMS")}>
                  {lang === "en" ? "Also send as SMS" : "���ንዲሁም በኤስኤምኤስ ላክ"}
                </Checkbox>
              </div>

              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gray-500" />
                <Checkbox {...register("withUrl")}>
                  {lang === "en" ? "Attach link (optional)" : "አባሪ አገናኝ (አማራጭ)"}
                </Checkbox>
              </div>

              {withUrlValue && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    {...register("url")}
                    type="text"
                    placeholder={lang === "en" ? "Enter URL" : "URL ያስገቡ"}
                    className="sm:col-span-2"
                  />
                  <Input
                    {...register("name")}
                    type="text"
                    placeholder={
                      lang === "en" ? "Link label (e.g. Open Course)" : "የአገናኝ ስም"
                    }
                  />
                </div>
              )}

              {Object.keys(formState.errors).length > 0 && (
                <div className="flex items-start gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>
                    {lang === "en"
                      ? "Please fix the errors above before submitting."
                      : "ከመላክዎ በፊት ካሉት ስህተቶች ያስተካክሉ።"}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="flat"
                isLoading={isPending}
                isDisabled={disabledSubmit}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {lang === "en" ? "Send Message" : "መልዕክት ላክ"}
              </Button>
            </div>
          </Form>
        </div>

        {/* Right Side Panel */}
        <div className="space-y-4">
          {/* Announcements Manager */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{lang === "en" ? "Announcements" : "ማሳወቂያዎች"}</h3>
            </div>

            {/* Course selector for announcements */}
            <div className="mb-3">
              <Select
                className="max-w-full"
                label={lang === "en" ? "Course" : "ኮርስ"}
                placeholder={lang === "en" ? "Select a course" : "ኮርስ ይምረጡ"}
                selectionMode="single"
                selectedKeys={announcementCourseId ? new Set([announcementCourseId]) : new Set()}
                onSelectionChange={(keys) => {
                  const id = Array.from(keys)[0] as string;
                  setAnnouncementCourseId(id);
                }}
              >
                {(courses ?? []).map((course: any) => (
                  <SelectItem key={course.id}>{course.titleEn}</SelectItem>
                ))}
              </Select>
            </div>

            {/* New announcement */}
            <form onSubmit={handlePublishAnnouncement} className="space-y-2">
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Write a new announcement..."
                    : "አዲስ ማሳወቂያ ይጻፉ..."
                }
                minRows={3}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {lang === "en"
                    ? "Announcements are shown to students inside the course."
                    : "ማሳወቂያዎች በኮርሱ ውስጥ ለተማሪዎች ይታያሉ።"}
                </span>
                <span>{announcementText.length} {lang === "en" ? "characters" : "ፊደላት"}</span>
              </div>
              <Button
                type="submit"
                size="sm"
                isLoading={creatingAnnouncement}
                isDisabled={!announcementCourseId || !announcementText.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {lang === "en" ? "Publish" : "አስቀምጥ"}
              </Button>
            </form>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

            {/* Announcements list */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {loadingAnnouncements ? (
                <div className="text-xs text-gray-500">{lang === "en" ? "Loading announcements..." : "ማሳወቂያዎች በመጫን ላይ..."}</div>
              ) : !announcements || (announcements as AnnouncementItem[]).length === 0 ? (
                <div className="text-xs text-gray-500">{lang === "en" ? "No announcements yet." : "ማሳወቂያ የለም።"}</div>
              ) : (
                (announcements as AnnouncementItem[]).map((a) => (
                  <div key={a.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 grid place-content-center">
                        <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(a.createdAt).toLocaleDateString(
                              lang === "en" ? "en-US" : "am-ET",
                              { year: "numeric", month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {a.anouncementDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollablePageWrapper>
  );
}
