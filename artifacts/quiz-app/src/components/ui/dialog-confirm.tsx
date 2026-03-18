import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[50%] gap-4 border bg-background p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogPrimitive.Title className="text-xl font-display font-bold">
          {title}
        </AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="text-muted-foreground mt-2">
          {description}
        </AlertDialogPrimitive.Description>
        <div className="flex justify-end gap-3 mt-6">
          <AlertDialogPrimitive.Cancel className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            {cancelText}
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-sm",
              variant === "destructive" 
                ? "bg-destructive hover:bg-destructive/90" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {confirmText}
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
