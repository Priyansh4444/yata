import { cn } from "@/libs/cn";
import type {
  DialogContentProps,
  DialogDescriptionProps,
  DialogTitleProps,
} from "@kobalte/core/dialog";
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ComponentProps, ParentProps, ValidComponent } from "solid-js";
import { mergeProps, splitProps } from "solid-js";

export const Sheet = DialogPrimitive;
export const SheetTrigger = DialogPrimitive.Trigger;

export const sheetVariants = cva(
  "fixed z-50 gap-4 bg-black/60 p-6 shadow-lg transform-gpu will-change-[opacity,transform] border border-white/10",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-[92vw] sm:w-[75vw] border-r",
        right: "inset-y-0 right-0 h-full w-[92vw] sm:w-[75vw] border-l",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type sheetContentProps<T extends ValidComponent = "div"> = ParentProps<
  DialogContentProps<T> &
    VariantProps<typeof sheetVariants> & {
      class?: string;
    }
>;

export const SheetContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, sheetContentProps<T>>,
) => {
  const merge = mergeProps<sheetContentProps<T>[]>({ side: "right" }, props);
  const [local, rest] = splitProps(merge as sheetContentProps, [
    "class",
    "children",
    "side",
  ]);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        class={cn("fixed inset-0 z-50 bg-black/60 sheet-overlay")}
      />
      <DialogPrimitive.Content
        class={cn(
          sheetVariants({ side: local.side, class: local.class }),
          "sheet-content",
          "overflow-y-auto h-full scrollbar-black"
        )}
        data-side={local.side}
        {...rest}
      >
        {local.children}
        <DialogPrimitive.CloseButton class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-[opacity,box-shadow] hover:opacity-100 focus:outline-none focus:ring-[1.5px] focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="h-4 w-4"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 6L6 18M6 6l12 12"
            />
            <title>Close</title>
          </svg>
        </DialogPrimitive.CloseButton>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

type sheetTitleProps<T extends ValidComponent = "h2"> = DialogTitleProps<T> & {
  class?: string;
};

export const SheetTitle = <T extends ValidComponent = "h2">(
  props: PolymorphicProps<T, sheetTitleProps<T>>,
) => {
  const [local, rest] = splitProps(props as sheetTitleProps, ["class"]);

  return (
    <DialogPrimitive.Title
      class={cn(
        "text-2xl sm:text-3xl font-semibold text-foreground font-inter",
        local.class,
      )}
      {...rest}
    />
  );
};

type sheetDescriptionProps<T extends ValidComponent = "p"> =
  DialogDescriptionProps<T> & {
    class?: string;
  };

export const SheetDescription = <T extends ValidComponent = "p">(
  props: PolymorphicProps<T, sheetDescriptionProps<T>>,
) => {
  const [local, rest] = splitProps(props as sheetDescriptionProps, ["class"]);

  return (
    <DialogPrimitive.Description
      class={cn(
        "text-sm sm:text-base text-muted-foreground font-inter",
        local.class,
      )}
      {...rest}
    />
  );
};

export const SheetHeader = (props: ComponentProps<"div">) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      class={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        local.class,
      )}
      {...rest}
    />
  );
};

export const SheetFooter = (props: ComponentProps<"div">) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        local.class,
      )}
      {...rest}
    />
  );
};
