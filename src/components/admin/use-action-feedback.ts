"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ActionFeedback } from "./action-result-dialog";

export function useActionFeedback() {
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  function succeed(title: string, description: string) {
    toast.success(title);
    setFeedback({ title, description, tone: "success" });
  }

  function fail(title: string, description: string) {
    toast.error(description);
    setFeedback({ title, description, tone: "error" });
  }

  function close() {
    setFeedback(null);
  }

  return { feedback, succeed, fail, close };
}
