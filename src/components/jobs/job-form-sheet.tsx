"use client";

import { ReactNode, useState } from "react";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { JobForm, JobFormValues } from "@/components/jobs/job-form";

type JobFormSheetProps = {
  clients: {
    id: string;
    name: string;
    default_currency?: string | null;
  }[];
  trigger?: ReactNode;
  job?: JobFormValues & { id: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const JobFormSheet = ({ clients, trigger, job, open: controlledOpen, onOpenChange: setControlledOpen }: JobFormSheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New job
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{job ? "Edit job" : "Create job"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <JobForm
            clients={clients}
            initialData={job}
            onSuccess={() => setOpen?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

