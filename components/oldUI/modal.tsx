import useOnBlur from "@/hooks/useOnBlur";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

export default function Modal({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useOnBlur(ref, open, () => {
    if (onClose) onClose();
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // layout
          // layoutId="modal"
          // initial={{}}
          // exit={{}}
          // animate={{}}
          className="z-[100] fixed inset-0 h-full p-2 bg-foreground/30 backdrop-blur grid items-center [&>div]:place-self-center [&>div>*]:w-80 [&>div>*]:md:w-96 [&>div>*]:rounded-md "
        >
          <div ref={ref} className="size-fit ">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
