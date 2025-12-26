import { UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "@/lib/action/user";
import useAction from "@/hooks/useAction";
import { useEffect } from "react";
import { unauthentic } from "@/lib/action/user";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserProps {
  userName?: string | null;
  navItems?: { label: string; url: string; icon: React.ReactNode }[];
}

export default function User({ userName, navItems = [] }: UserProps) {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en",
    formSchema = z.object({
      password: z.string({ message: "" }).nonempty("Password is required"),
      confirmPassword: z
        .string({ message: "" })
        .nonempty("ConfirmPassword is required"),
    }),
    { handleSubmit, register, formState, reset } = useForm<
      z.infer<typeof formSchema>
    >({
      resolver: zodResolver(formSchema),
      defaultValues: { password: "", confirmPassword: "" },
    }),
    { action } = useAction(changePassword, undefined, {
      loading: lang == "en" ? "Changing password" : "የይለፍ ቃል በመቀየር ላይ",
      success:
        lang == "en"
          ? "Password changed successfully"
          : "የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል።",
      error:
        lang == "en" ? "Failed to change password" : "የይለፍ ቃል መቀየር አልተሳካም።",
    }),
    { action: logout } = useAction(unauthentic, undefined, {
      loading: lang == "en" ? "Logging out" : "በመውጣት ላይ",
      success: lang == "en" ? "Successfully logged out" : "በተሳካ ሁኔታ ወጥቷል።",
      error: lang == "en" ? "Logged out failed" : "መውጣት አልተሳካም።",
    }),
    { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { isOpen: isPopoverOpen, onOpenChange: onPopoverOpenChange } = useDisclosure();

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  return (
    <div className="flex items-center gap-2">
      {userName && (
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {userName}
        </span>
      )}
      <Popover 
        placement="bottom-end" 
        showArrow
        isOpen={isPopoverOpen}
        onOpenChange={onPopoverOpenChange}
      >
        <PopoverTrigger>
          <button className="p-1.5 rounded-full border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <UserRound className="size-6 text-gray-600 dark:text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="flex flex-col gap-1">
            {/* Navigation Items - Only this section scrolls */}
            {navItems.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={`/${lang}/${item.url}`}
                    onClick={() => onPopoverOpenChange(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-gray-600 dark:text-gray-400">{item.icon}</span>
                    <span className="capitalize">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Divider */}
            {navItems.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            )}

            {/* Account Settings - Always visible */}
            <Button
              variant="light"
              onPress={onOpen}
              className="justify-start text-sm text-gray-700 dark:text-gray-300"
            >
              {lang == "en" ? "Change Password" : "የይለፍ ቃል ቀይር"}
            </Button>

            {/* Logout - Always visible */}
            <Button
              variant="light"
              color="danger"
              onPress={() => logout()}
              className="justify-start text-sm"
            >
              {lang == "en" ? "Sign out" : "ውጣ"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <Form
          onSubmit={handleSubmit(action)}
          validationErrors={Object.entries(formState.errors).reduce(
            (a, [key, value]) => {
              return { ...a, [key]: value.message };
            },
            {}
          )}
        >
          <ModalContent className="">
            {(onClose) => (
              <>
                <ModalHeader>
                  {lang == "en" ? "Password Change" : "የይለፍ ቃል ቀይር"}
                </ModalHeader>
                <ModalBody className="">
                  <Input {...register("password")} placeholder="Password" />
                  <Input
                    {...register("confirmPassword")}
                    placeholder="Confirm Password"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Back
                  </Button>
                  <Button color="primary" type="submit">
                    Change
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </Modal>
    </div>
  );
}
