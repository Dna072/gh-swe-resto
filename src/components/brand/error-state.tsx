import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Alert
      variant="destructive"
      className={cn("border-destructive/30 bg-destructive/5", className)}
    >
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </AlertDescription>
    </Alert>
  );
}
