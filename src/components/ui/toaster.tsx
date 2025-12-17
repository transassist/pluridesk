"use client";

import {
  Toast,
  ToastAction,
  ToastCloseIcon,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} {...props} className={variant === "destructive" ? "border-destructive bg-destructive/10" : undefined}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action && <ToastAction altText="Action">{action}</ToastAction>}
            <ToastCloseIcon />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

