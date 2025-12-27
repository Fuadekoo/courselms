import { registerPermission } from "@/actions/manager/manager";
import useAction from "@/hooks/useAction";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
} from "@heroui/react";
import { useState } from "react";

export function Permission({
  data: { id, permission },
  refresh,
  onOpenChange,
}: {
  data: {
    id: string;
    permission: string[];
  };
  refresh: () => void;
  onOpenChange: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en",
    router = useRouter(),
    [input, setInput] = useState<string[]>(permission),
    { action, isPending } = useAction(registerPermission, undefined, {
      onSuccess({ status }) {
        if (status) {
          router.refresh();
          refresh();
          onOpenChange();
        }
      },
    });
  return (
    <Modal
      isOpen
      onOpenChange={onOpenChange}
      backdrop="blur"
      placement="center"
      classNames={{ wrapper: "p-5" }}
    >
      <ModalContent className="">
        {(onClose) => (
          <>
            <ModalHeader className="">
              {lang == "en" ? "Manager Permission" : "አስተዳዳሪ ፈቃድ"}
            </ModalHeader>
            <ModalBody className="p-2 md:p-10 grid gap-2 grid-cols-2 ">
              {[
                "dashboard",
                "manager",
                "instructor",
                "seller",
                "affiliate",
                "course",
                "message",
                "feedback",
                "student",
                "courseMaterials",
                "publicAnnouncment",
                "periodicDiscount",
                "videoConversion",
                "assigningCourseToTags",
              ].map((v, i) => {
                return (
                  <Switch
                    key={i + ""}
                    size="sm"
                    className="max-w-full shrink-0 p-2 rounded-xl bg-foreground/30 border border-foreground/30 data-[selected=true]:border-primary/30 data-[selected=true]:bg-primary/30 flex"
                    isSelected={input.includes(v)}
                    onValueChange={() => {
                      setInput((prev) =>
                        prev.includes(v)
                          ? prev.filter((value) => value != v)
                          : [...prev, v]
                      );
                    }}
                  >
                    {v}
                  </Switch>
                );
              })}
            </ModalBody>
            <ModalFooter className="grid gap-4 grid-cols-2">
              <Button variant="flat" onPress={onClose}>
                {lang == "en" ? "Back" : "ተመለስ"}
              </Button>
              <Button
                color="primary"
                onPress={() => action({ id, permission: input })}
                isLoading={isPending}
              >
                {lang == "en" ? "Submit" : "መዝግብ"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
