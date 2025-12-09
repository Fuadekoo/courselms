import { cn } from "@/lib/utils";
import React from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { motion } from "framer-motion";

type ControlProps<T extends FieldValues> =
  | {
      control: ControllerProps<T>["control"];
      name: FieldPath<T>;
      rules?: ControllerProps<T>["rules"];
    }
  | { control?: undefined; name?: undefined; rules?: undefined };

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  switchClassName?: string;
}
//

function CustomController<T extends FieldValues>(
  {
    control,
    name,
    rules,
    className,
    switchClassName,
    label,
    ...props
  }: InputProps & ControlProps<T>,
  ref: React.Ref<HTMLInputElement>
) {
  return control ? (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ fieldState, field }) => (
        <div className={cn("h-fit grid  ", className)}>
          {label && (
            <span
              className={
                cn("")
                // fieldState.error || fieldState.invalid ? "text-danger-900" : ""
              }
            >
              {label}
            </span>
          )}
          <label
            className={cn(
              "w-20  rounded-full overflow-hidden-  ",
              field.value ? "bg-primary/20" : "bg-neutral/20",
              switchClassName
            )}
          >
            <input
              {...props}
              {...field}
              onChange={(e) => {
                if (props.onChange) {
                  props.onChange(e);
                }
                field.onChange(e);
              }}
              ref={ref}
              type={"checkbox"}
              className="hidden peer"
            />
            <motion.div
              layout
              layoutId="switch"
              initial={{ translateX: "0" }}
              animate={{ translateX: field.value ? "100%" : "0" }}
              className="w-1/2 aspect-square bg-neutral rounded-full shadow-md peer-checked:bg-primary"
            />
          </label>
          <span
            className={cn(
              "h-4 text-xs ",
              fieldState.error || fieldState.invalid ? "text-danger-900" : ""
            )}
          >
            {fieldState.error?.message}
          </span>
        </div>
      )}
    />
  ) : (
    <div className={cn("h-fit grid ", className)}>
      {label && <span className={cn("")}>{label}</span>}
      <label
        className={cn(
          "w-20  rounded-full overflow-hidden  ",
          props.checked ? "bg-primary/20" : "bg-neutral/20",
          switchClassName
        )}
      >
        <input
          {...props}
          name={name}
          ref={ref}
          type={"checkbox"}
          className="hidden peer"
        />
        <motion.div
          layout
          layoutId="switch"
          initial={{ translateX: "0" }}
          animate={{ translateX: props.checked ? "100%" : "0" }}
          className="w-1/2 aspect-square bg-neutral peer-checked:bg-primary rounded-full shadow-md"
        />
      </label>
    </div>
  );
}

const Switch = React.forwardRef(CustomController) as <T extends FieldValues>(
  props: InputProps & ControlProps<T> & { ref?: React.Ref<HTMLInputElement> }
) => React.JSX.Element;

export default Switch;
