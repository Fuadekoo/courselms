"use client";

import { CInput } from "@/components/heroui";
import { Edit2, Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { useStudentProfile } from "@/stores";
import { toast } from "sonner";

const profileSchema = z.object({
  firstName: z.string({ message: "" }).min(1, "First Name is required"),
  fatherName: z.string({ message: "" }).min(1, "Father Name is required"),
  lastName: z.string({ message: "" }).min(1, "Last Name is required"),
  country: z.string({ message: "" }).min(1, "Country is required"),
  region: z.string({ message: "" }).min(1, "Region is required"),
  city: z.string({ message: "" }).min(1, "City is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function StudentProfilePage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const [isEditing, setIsEditing] = useState(false);

  // Use Zustand store for profile data with automatic caching
  const {
    profile,
    isLoading,
    updateProfile: updateProfileAction,
  } = useStudentProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const { handleSubmit, register, formState, setValue, reset } =
    useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: "",
        fatherName: "",
        lastName: "",
        country: "",
        region: "",
        city: "",
      },
    });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setValue("firstName", profile.firstName || "");
      setValue("fatherName", profile.fatherName || "");
      setValue("lastName", profile.lastName || "");
      setValue("country", profile.country || "");
      setValue("region", profile.region || "");
      setValue("city", profile.city || "");
      reset({
        firstName: profile.firstName || "",
        fatherName: profile.fatherName || "",
        lastName: profile.lastName || "",
        country: profile.country || "",
        region: profile.region || "",
        city: profile.city || "",
      });
    }
  }, [profile, setValue, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    const loadingToast = toast.loading(
      lang === "en" ? "Updating profile..." : "መገለጫ በማዘመን ላይ..."
    );

    try {
      const result = await updateProfileAction({} as any, data);

      if (result && result.status) {
        toast.success(
          lang === "en" ? "Profile updated successfully" : "መገለጫ በተሳካ ሁኔታ ተዘመነ",
          { id: loadingToast }
        );
        setIsEditing(false);
      } else {
        toast.error(
          result?.message ||
            (lang === "en" ? "Failed to update profile" : "መገለጫ ማዘመን አልተሳካም"),
          { id: loadingToast }
        );
      }
    } catch (error) {
      toast.error(
        lang === "en" ? "Failed to update profile" : "መገለጫ ማዘመን አልተሳካም",
        { id: loadingToast }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Loading is handled by TopLoadingBar in layout
  if (isLoading || !profile) return null;

  const fullName =
    [profile.firstName, profile.fatherName, profile.lastName]
      .filter(Boolean)
      .join(" ") || (lang === "en" ? "User" : "ተጠቃሚ");

  const location =
    [profile.city, profile.region, profile.country]
      .filter(Boolean)
      .join(", ") || (lang === "en" ? "Not set" : "አልተቀመጠም");

  // Get initial letter for avatar
  const initial = fullName.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">U</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  {lang === "en" ? "User Profile" : "የተጠቃሚ መገለጫ"}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {lang === "en"
                  ? "Manage your account settings and preferences"
                  : "የመለያዎን ማቀናበሪያዎች እና ምርጫዎችን ያቅዱ"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          {/* Section Header */}
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              {lang === "en" ? "Profile Information" : "የመገለጫ መረጃ"}
            </h2>
            {!isEditing && (
              <Button
                onPress={handleEdit}
                startContent={<Edit2 className="w-4 h-4" />}
                color="primary"
                variant="flat"
                size="sm"
                className="bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400"
              >
                {lang === "en" ? "Edit" : "አርም"}
              </Button>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 sm:p-8">
              {/* Avatar Section */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl sm:text-4xl">
                    {initial}
                  </span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Full Name - Show combined or individual fields */}
                  {!isEditing ? (
                    <div>
                      <CInput
                        label={lang === "en" ? "Full Name" : "ሙሉ ስም"}
                        value={
                          fullName || (lang === "en" ? "Not set" : "አልተቀመጠም")
                        }
                        isDisabled
                        className="w-full"
                        classNames={{
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <CInput
                          {...register("firstName")}
                          label={lang === "en" ? "First Name" : "የመጀመሪያ ስም"}
                          isDisabled={false}
                          errorMessage={formState.errors.firstName?.message}
                          isInvalid={!!formState.errors.firstName}
                          className="w-full"
                          classNames={{
                            inputWrapper:
                              "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700",
                          }}
                        />
                      </div>
                      <div>
                        <CInput
                          {...register("fatherName")}
                          label={lang === "en" ? "Father Name" : "የአባት ስም"}
                          isDisabled={false}
                          errorMessage={formState.errors.fatherName?.message}
                          isInvalid={!!formState.errors.fatherName}
                          className="w-full"
                          classNames={{
                            inputWrapper:
                              "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700",
                          }}
                        />
                      </div>
                      <div>
                        <CInput
                          {...register("lastName")}
                          label={lang === "en" ? "Last Name" : "የአያት ስም"}
                          isDisabled={false}
                          errorMessage={formState.errors.lastName?.message}
                          isInvalid={!!formState.errors.lastName}
                          className="w-full"
                          classNames={{
                            inputWrapper:
                              "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700",
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Email Address */}
                  <div>
                    <CInput
                      label={lang === "en" ? "Email Address" : "ኢሜይል አድራሻ"}
                      value={lang === "en" ? "Not available" : "አልተገኘም"}
                      isDisabled
                      className="w-full"
                      classNames={{
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <CInput
                      label={lang === "en" ? "Phone Number" : "የስልክ ቁጥር"}
                      value={profile.phoneNumber || ""}
                      isDisabled
                      className="w-full"
                      classNames={{
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <CInput
                      label={lang === "en" ? "Role" : "ሚና"}
                      value={
                        profile.role
                          ? profile.role.charAt(0).toUpperCase() +
                            profile.role.slice(1)
                          : ""
                      }
                      isDisabled
                      className="w-full"
                      classNames={{
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Account Information Section */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      {lang === "en" ? "Account Information" : "የመለያ መረጃ"}
                    </h3>

                    {/* Member Since */}
                    <div>
                      <CInput
                        label={lang === "en" ? "Member Since" : "አባል የሆነው"}
                        value={lang === "en" ? "Not available" : "አልተገኘም"}
                        isDisabled
                        className="w-full"
                        classNames={{
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Username */}
                  <div>
                    <CInput
                      label={lang === "en" ? "Username" : "የተጠቃሚ ስም"}
                      value={
                        profile.username
                          ? `@${profile.username}`
                          : lang === "en"
                          ? "Not set"
                          : "አልተቀመጠም"
                      }
                      isDisabled
                      className="w-full"
                      classNames={{
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                      {lang === "en"
                        ? "Username cannot be changed"
                        : "የተጠቃሚ ስም ሊቀየር አይችልም"}
                    </p>
                  </div>

                  {/* Department (using Region) */}
                  <div>
                    <CInput
                      {...register("region")}
                      label={lang === "en" ? "Region" : "ክልል"}
                      isDisabled={!isEditing}
                      errorMessage={formState.errors.region?.message}
                      isInvalid={!!formState.errors.region}
                      className="w-full"
                      classNames={{
                        inputWrapper: isEditing
                          ? "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <CInput
                      {...register("city")}
                      label={lang === "en" ? "Location" : "አካባቢ"}
                      isDisabled={!isEditing}
                      errorMessage={formState.errors.city?.message}
                      isInvalid={!!formState.errors.city}
                      className="w-full"
                      classNames={{
                        inputWrapper: isEditing
                          ? "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <CInput
                      {...register("country")}
                      label={lang === "en" ? "Country" : "ሀገር"}
                      isDisabled={!isEditing}
                      errorMessage={formState.errors.country?.message}
                      isInvalid={!!formState.errors.country}
                      className="w-full"
                      classNames={{
                        inputWrapper: isEditing
                          ? "bg-white dark:bg-gray-800 border-sky-300 dark:border-sky-700"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      }}
                    />
                  </div>

                  {/* Additional Fields */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      {lang === "en" ? "Additional Information" : "ተጨማሪ መረጃ"}
                    </h3>

                    {/* Last Login */}
                    <div>
                      <CInput
                        label={lang === "en" ? "Last Login" : "የመጨረሻ መግቢያ"}
                        value={lang === "en" ? "Not available" : "አልተገኘም"}
                        isDisabled
                        className="w-full"
                        classNames={{
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    onPress={handleCancel}
                    startContent={<X className="w-4 h-4" />}
                    variant="flat"
                    color="default"
                    isDisabled={isUpdating}
                    size="lg"
                  >
                    {lang === "en" ? "Cancel" : "ሰርዝ"}
                  </Button>
                  <Button
                    type="submit"
                    startContent={<Save className="w-4 h-4" />}
                    color="primary"
                    isLoading={isUpdating}
                    size="lg"
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {lang === "en" ? "Save Changes" : "ለውጦችን አስቀምጥ"}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
