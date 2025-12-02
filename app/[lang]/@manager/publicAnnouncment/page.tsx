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
  Upload,
  X,
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

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
    // Clear uploaded image if user manually enters URL
    if (name === "photo" && uploadedImage) {
      setUploadedImage(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(
        lang === "en"
          ? "Please select an image file"
          : "እባክዎ የምስል ፋይል ይምረጡ"
      );
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(
        lang === "en"
          ? "Image size must be less than 5MB"
          : "የምስል መጠን ከ 5MB ያነሰ መሆን አለበት"
      );
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/upload-announcement-image", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setFormData((prev) => ({ ...prev, photo: data.imageUrl }));
        setUploadedImage(data.imageUrl);
        toast.success(
          lang === "en"
            ? "Image uploaded successfully"
            : "ምስል በተሳካ ሁኔታ ተስቀለ"
        );
      } else {
        toast.error(
          data.error ||
            (lang === "en" ? "Upload failed" : "ስቀል አልተሳካም")
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        lang === "en" ? "Upload failed" : "ስቀል አልተሳካም"
      );
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, photo: "" }));
    setUploadedImage(null);
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
    setUploadedImage(announcement.photo || null);
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
    setUploadedImage(null);
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {lang === "en" ? "Image (Optional)" : "ምስል (አማራጭ)"}
                  </label>
                  
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-default-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="announcement-image-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="announcement-image-upload"
                      className={`flex flex-col items-center justify-center cursor-pointer ${
                        isUploading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploadedImage || formData.photo ? (
                        <div className="relative w-full">
                          <img
                            src={uploadedImage || formData.photo}
                            alt="Announcement"
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="solid"
                            className="absolute top-2 right-2"
                            onPress={handleRemoveImage}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Upload className="h-8 w-8 text-default-400" />
                          <p className="text-sm text-default-600">
                            {lang === "en"
                              ? "Click to upload or drag and drop"
                              : "ለመስቀል ጠቅ ያድርጉ ወይም ይጎትቱ"}
                          </p>
                          <p className="text-xs text-default-500">
                            {lang === "en"
                              ? "PNG, JPG, WEBP up to 5MB"
                              : "PNG, JPG, WEBP እስከ 5MB"}
                          </p>
                        </div>
                      )}
                    </label>
                    {isUploading && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-default-600">
                          {lang === "en" ? "Uploading..." : "ስቀል በሂደት ላይ..."}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* URL Input (Alternative) */}
                  <div className="text-xs text-default-500 text-center">
                    {lang === "en" ? "OR" : "ወይም"}
                  </div>
                  <Input
                    label={
                      lang === "en"
                        ? "Image URL (Alternative)"
                        : "የምስል URL (አማራጭ)"
                    }
                    name="photo"
                    value={formData.photo}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    description={
                      lang === "en"
                        ? "Enter image URL if you prefer not to upload"
                        : "ከመስቀል ይልቅ URL ማስገባት ከፈለጉ"
                    }
                    endContent={
                      formData.photo && !uploadedImage && (
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
