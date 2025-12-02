/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableColumn,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Chip,
  Badge,
} from "@heroui/react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import {
  getPeriodicDiscounts,
  createPeriodicDiscount,
  updatePeriodicDiscount,
  deletePeriodicDiscount,
} from "@/actions/manager/periodic-discount";
import { getCourses } from "@/lib/data/course";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import useData from "@/hooks/useData";

type DiscountType = "PERCENT";
type Frequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

interface Discount {
  id: string;
  title: string;
  description?: string | null;
  type: DiscountType;
  value: number;
  startDate: string;
  endDate?: string | null;
  frequency: Frequency;
  daysOfWeek?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  allDiscountIds?: string[];
  allCourses?: Course[];
}

interface Course {
  id: string;
  titleEn: string;
  titleAm: string;
}

// Countdown Timer Component
function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.expired) {
    return (
      <Chip color="danger" size="sm" variant="flat">
        Expired
      </Chip>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <Clock className="h-3 w-3" />
      <span className="font-mono">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
        {timeLeft.seconds}s
      </span>
    </div>
  );
}

export default function PeriodicDiscountsPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );

  const { data: courses } = useData({
    func: getCourses,
    args: [],
  });

  const [formData, setFormData] = useState({
    title: "",
    type: "PERCENT" as DiscountType,
    value: 0,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: "",
    frequency: "NONE" as Frequency,
    daysOfWeek: "",
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const result = await getPeriodicDiscounts();
      if (result.error) {
        toast.error(result.error);
      } else {
        setDiscounts(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error(
        lang === "en" ? "Failed to load discounts" : "ቅናሾችን ለመጫን አልተሳካም"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.endDate) {
      toast.error(lang === "en" ? "End date is required" : "የመጨረሻ ቀን ያስፈልጋል");
      return;
    }

    if (selectedCourses.size === 0) {
      toast.error(
        lang === "en"
          ? "Please select at least one course"
          : "እባክዎ ቢያንስ አንድ ኮርስ ይምረጡ"
      );
      return;
    }

    try {
      const courseIds = Array.from(selectedCourses);
      const discountData = {
        ...formData,
        description: JSON.stringify({
          courseIds,
        }),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      let result;
      if (editingId) {
        result = await updatePeriodicDiscount(editingId, discountData);
      } else {
        result = await createPeriodicDiscount(discountData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          lang === "en"
            ? editingId
              ? "Discount updated successfully"
              : "Discount created successfully"
            : editingId
            ? "ቅናሽ በተሳካ ሁኔታ ተዘምኗል"
            : "ቅናሽ በተሳካ ሁኔታ ተፈጥሯል"
        );
        await fetchDiscounts();
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error(
        lang === "en" ? "Failed to save discount" : "ቅናሽን ለመቀረጽ አልተሳካም"
      );
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingId(discount.id);
    
    // Get title from description if available, otherwise use discount.title
    let title = discount.title;
    try {
      if (discount.description) {
        const parsed = JSON.parse(discount.description);
        if (parsed.title) {
          title = parsed.title;
        }
      }
    } catch {
      // Use default title if parsing fails
    }
    
    setFormData({
      title: title,
      type: discount.type,
      value: discount.value,
      startDate: new Date(discount.startDate).toISOString().slice(0, 16),
      endDate: discount.endDate
        ? new Date(discount.endDate).toISOString().slice(0, 16)
        : "",
      frequency: discount.frequency,
      daysOfWeek: discount.daysOfWeek || "",
      isActive: discount.isActive,
    });

    // Parse course IDs from description or use allCourses
    try {
      if (discount.description) {
        const parsed = JSON.parse(discount.description);
        if (parsed.courseIds && Array.isArray(parsed.courseIds)) {
          setSelectedCourses(new Set(parsed.courseIds));
        } else if (discount.allCourses && Array.isArray(discount.allCourses)) {
          // Fallback to allCourses if courseIds not in description
          setSelectedCourses(new Set(discount.allCourses.map((c) => c.id)));
        }
      } else if (discount.allCourses && Array.isArray(discount.allCourses)) {
        // Use allCourses if description is not available
        setSelectedCourses(new Set(discount.allCourses.map((c) => c.id)));
      } else {
        setSelectedCourses(new Set());
      }
    } catch {
      // If parsing fails, try to use allCourses
      if (discount.allCourses && Array.isArray(discount.allCourses)) {
        setSelectedCourses(new Set(discount.allCourses.map((c) => c.id)));
      } else {
        setSelectedCourses(new Set());
      }
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        lang === "en"
          ? "Are you sure you want to delete this discount?"
          : "ይህን ቅናሽ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?"
      )
    ) {
      try {
        const result = await deletePeriodicDiscount(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            lang === "en"
              ? "Discount deleted successfully"
              : "ቅናሽ በተሳካ ሁኔታ ተሰርዟል"
          );
          await fetchDiscounts();
        }
      } catch (error) {
        console.error("Error deleting discount:", error);
        toast.error(
          lang === "en" ? "Failed to delete discount" : "ቅናሽን ለመሰረዝ አልተሳካም"
        );
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setSelectedCourses(new Set());
    setFormData({
      title: "",
      type: "PERCENT",
      value: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: "",
      frequency: "NONE",
      daysOfWeek: "",
      isActive: true,
    });
  };

  const getCourseNames = (discount: Discount) => {
    try {
      // First try to use allCourses if available
      if (discount.allCourses && Array.isArray(discount.allCourses)) {
        return discount.allCourses
          .map((course: Course) =>
            lang === "en" ? course.titleEn : course.titleAm
          )
          .join(", ");
      }

      // Fallback to parsing description
      if (discount.description) {
        const parsed = JSON.parse(discount.description);
        if (parsed.courseIds && Array.isArray(parsed.courseIds)) {
          return parsed.courseIds
            .map((courseId: string) => {
              const course = courses?.find((c: Course) => c.id === courseId);
              return course
                ? lang === "en"
                  ? course.titleEn
                  : course.titleAm
                : courseId;
            })
            .join(", ");
        }
      }
    } catch {
      // If parsing fails, return empty
    }
    return lang === "en" ? "No courses" : "ኮርስ የለም";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {lang === "en" ? "Periodic Discounts" : "ወቅታዊ ቅናሾች"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "en"
              ? "Manage periodic discounts for your courses"
              : "የኮርሶችዎን ወቅታዊ ቅናሾች ያስተዳድሩ"}
          </p>
        </div>
        <Button
          onClick={() => {
            handleCloseDialog();
            setIsDialogOpen(true);
          }}
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
        >
          {lang === "en" ? "Add Discount" : "ቅናሽ ጨምር"}
        </Button>
      </div>

      <Card>
        <CardBody className="p-6">
          <Table>
            <TableHeader>
              <TableColumn>{lang === "en" ? "Title" : "ርዕስ"}</TableColumn>
              <TableColumn>{lang === "en" ? "Courses" : "ኮርሶች"}</TableColumn>
              <TableColumn>{lang === "en" ? "Discount" : "ቅናሽ"}</TableColumn>
              <TableColumn>
                {lang === "en" ? "Start Date" : "የመጀመሪያ ቀን"}
              </TableColumn>
              <TableColumn>
                {lang === "en" ? "End Date" : "የመጨረሻ ቀን"}
              </TableColumn>
              <TableColumn>
                {lang === "en" ? "Time Left" : "የቀረው ጊዜ"}
              </TableColumn>
              <TableColumn>{lang === "en" ? "Status" : "ሁኔታ"}</TableColumn>
              <TableColumn>{lang === "en" ? "Actions" : "ድርጊቶች"}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No discounts found">
              {discounts.map((discount) => {
                const isActive =
                  discount.isActive &&
                  new Date(discount.startDate) <= new Date() &&
                  (!discount.endDate ||
                    new Date(discount.endDate) >= new Date());

                return (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">
                      {discount.title}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm text-default-600 line-clamp-2">
                          {getCourseNames(discount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {discount.value}%
                    </TableCell>
                    <TableCell>
                      {format(new Date(discount.startDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {discount.endDate
                        ? format(new Date(discount.endDate), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {discount.endDate ? (
                        <CountdownTimer endDate={discount.endDate} />
                      ) : (
                        <span className="text-xs text-default-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={isActive ? "success" : "default"}
                        variant="flat"
                      >
                        {isActive
                          ? lang === "en"
                            ? "Active"
                            : "ንቁ"
                          : lang === "en"
                          ? "Inactive"
                          : "ንቁ አይደለም"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="light"
                          size="sm"
                          isIconOnly
                          onClick={() => handleEdit(discount)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="light"
                          color="danger"
                          size="sm"
                          isIconOnly
                          onClick={() => handleDelete(discount.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {editingId
                ? lang === "en"
                  ? "Edit Discount"
                  : "ቅናሽ አርም"
                : lang === "en"
                ? "Add New Discount"
                : "አዲስ ቅናሽ ጨምር"}
            </h3>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-4">
              <Input
                label={lang === "en" ? "Title" : "ርዕስ"}
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={
                  lang === "en"
                    ? "e.g., Summer Sale 2025"
                    : "ለምሳሌ: የበጋ 2025 ሽያጭ"
                }
              />

              <Select
                label={lang === "en" ? "Select Courses" : "ኮርሶች ይምረጡ"}
                selectionMode="multiple"
                selectedKeys={selectedCourses}
                onSelectionChange={(keys) =>
                  setSelectedCourses(keys as Set<string>)
                }
                required
                placeholder={
                  lang === "en"
                    ? "Select one or more courses"
                    : "አንድ ወይም ከዚያ በላይ ኮርሶች ይምረጡ"
                }
              >
                {(courses || []).map((course: Course) => (
                  <SelectItem key={course.id} textValue={lang === "en" ? course.titleEn : course.titleAm}>
                    {lang === "en" ? course.titleEn : course.titleAm}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label={lang === "en" ? "Discount Percentage" : "የቅናሽ መቶኛ"}
                name="value"
                type="number"
                value={formData.value.toString()}
                onChange={handleInputChange}
                required
                min={1}
                max={100}
                endContent={<span className="text-default-500">%</span>}
                description={
                  lang === "en"
                    ? "Enter a percentage between 1 and 100"
                    : "ከ1 እስከ 100 መቶኛ ያስገቡ"
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={lang === "en" ? "Start Date" : "የመጀመሪያ ቀን"}
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label={lang === "en" ? "End Date" : "የመጨረሻ ቀን"}
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  min={formData.startDate}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleCloseDialog}>
                {lang === "en" ? "Cancel" : "ተወው"}
              </Button>
              <Button
                color="primary"
                type="submit"
                onPress={(e) => handleSubmit(e as any)}
              >
                {editingId
                  ? lang === "en"
                    ? "Update"
                    : "አዘምን"
                  : lang === "en"
                  ? "Create"
                  : "ፍጠር"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
