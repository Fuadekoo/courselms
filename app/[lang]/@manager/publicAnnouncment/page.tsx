"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Button,
  Input,
  Textarea,
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
} from "@heroui/react";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Bell as BellIcon,
} from "lucide-react";
import {
  getPublicAnnouncements,
  createPublicAnnouncement,
  updatePublicAnnouncement,
  deletePublicAnnouncement,
} from "@/actions/manager/public-announcement";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function PublicAnnouncementsPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const [announcements, setAnnouncements] = useState<
    Array<{
      id: string;
      message: string;
      photo?: string | null;
      createdAt: Date | string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    message: "",
    photo: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const result = await getPublicAnnouncements();
      if (result.error) {
        toast.error(result.error);
      } else {
        setAnnouncements(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error(
        lang === "en" ? "Failed to load announcements" : "ማስታወቂያዎችን ለመጫን አልተሳካም"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result;
      if (formData.id) {
        result = await updatePublicAnnouncement(formData.id, {
          message: formData.message,
          photo: formData.photo || null,
        });
      } else {
        result = await createPublicAnnouncement({
          message: formData.message,
          photo: formData.photo || null,
        });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          lang === "en"
            ? formData.id
              ? "Announcement updated successfully"
              : "Announcement created successfully"
            : formData.id
            ? "ማስታወቂያ በተሳካ ሁኔታ ተዘምኗል"
            : "ማስታወቂያ በተሳካ ሁኔታ ተፈጥሯል"
        );
        await fetchAnnouncements();
        resetForm();
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error(
        lang === "en" ? "Failed to save announcement" : "ማስታወቂያን ለመቀረጽ አልተሳካም"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: (typeof announcements)[0]) => {
    setFormData({
      id: announcement.id,
      message: announcement.message,
      photo: announcement.photo || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        lang === "en"
          ? "Are you sure you want to delete this announcement?"
          : "ይህን ማስታወቂያ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?"
      )
    ) {
      try {
        const result = await deletePublicAnnouncement(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            lang === "en"
              ? "Announcement deleted successfully"
              : "ማስታወቂያ በተሳካ ሁኔታ ተሰርዟል"
          );
          await fetchAnnouncements();
        }
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error(
          lang === "en"
            ? "Failed to delete announcement"
            : "ማስታወቂያን ለመሰረዝ አልተሳካም"
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      message: "",
      photo: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {lang === "en" ? "Public Announcements" : "የህዝብ ማስታወቂያዎች"}
          </h1>
          <p className="text-gray-600">
            {lang === "en"
              ? "Manage announcements that will be displayed to users"
              : "ለተጠቃሚዎች የሚታዩ ማስታወቂያዎችን ያስተዳድሩ"}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          startContent={<Plus className="h-4 w-4" />}
          color="primary"
        >
          {lang === "en" ? "Add Announcement" : "ማስታወቂያ ጨምር"}
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableColumn>
                    {lang === "en" ? "Message" : "መልዕክት"}
                  </TableColumn>
                  <TableColumn className="hidden md:table-cell">
                    {lang === "en" ? "Image" : "ምስል"}
                  </TableColumn>
                  <TableColumn className="hidden md:table-cell">
                    {lang === "en" ? "Created At" : "የተፈጠረበት ቀን"}
                  </TableColumn>
                  <TableColumn>
                    {lang === "en" ? "Actions" : "ድርጊቶች"}
                  </TableColumn>
                </TableHeader>
                <TableBody emptyContent="No announcements found">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => {
                      return (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-medium max-w-[300px]">
                            <div className="line-clamp-2">
                              {announcement.message}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {announcement.photo ? (
                              <a
                                href={announcement.photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center text-sm"
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />{" "}
                                {lang === "en" ? "View" : "አሳይ"}
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                {lang === "en" ? "No image" : "ምስል የለም"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(announcement.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="light"
                                size="sm"
                                isIconOnly
                                onClick={() => handleEdit(announcement)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="light"
                                color="danger"
                                size="sm"
                                isIconOnly
                                onClick={() => handleDelete(announcement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <BellIcon className="h-12 w-12 text-gray-300" />
                          <p className="text-lg font-medium">
                            {lang === "en"
                              ? "No announcements yet"
                              : "እስካሁን ምንም ማስታወቂያዎች የሉም"}
                          </p>
                          <p>
                            {lang === "en"
                              ? "Get started by creating your first announcement"
                              : "የመጀመሪያዎን ማስታወቂያ በመፍጠር ይጀምሩ"}
                          </p>
                          <Button
                            onClick={() => {
                              resetForm();
                              setIsOpen(true);
                            }}
                            startContent={<Plus className="h-4 w-4" />}
                            color="primary"
                          >
                            {lang === "en"
                              ? "Create Announcement"
                              : "ማስታወቂያ ፍጠር"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setIsOpen(false);
          }
        }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {formData.id
                ? lang === "en"
                  ? "Edit Announcement"
                  : "ማስታወቂያ አርም"
                : lang === "en"
                ? "Create New Announcement"
                : "አዲስ ማስታወቂያ ፍጠር"}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="space-y-4">
                <Textarea
                  label={lang === "en" ? "Message" : "መልዕክት"}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={
                    lang === "en"
                      ? "Enter announcement message"
                      : "የማስታወቂያ መልዕክት ያስገቡ"
                  }
                  required
                  minRows={4}
                />

                <Input
                  label={
                    lang === "en" ? "Image URL (Optional)" : "የምስል URL (አማራጭ)"
                  }
                  name="photo"
                  value={formData.photo}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  endContent={
                    formData.photo && (
                      <a
                        href={formData.photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />{" "}
                        {lang === "en" ? "Preview" : "ይመልከቱ"}
                      </a>
                    )
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => {
                  resetForm();
                  setIsOpen(false);
                }}
              >
                {lang === "en" ? "Cancel" : "ተወው"}
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {formData.id
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
