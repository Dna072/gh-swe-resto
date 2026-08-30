"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ActionFeedback = {
  title: string;
  description: string;
  tone: "success" | "error";
};

export function ActionResultDialog({
  feedback,
  onClose,
}: {
  feedback: ActionFeedback | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(feedback)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{feedback?.title ?? ""}</DialogTitle>
          <DialogDescription>{feedback?.description ?? ""}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" size="touch" onClick={onClose}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
