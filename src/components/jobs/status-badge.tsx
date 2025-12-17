import { Badge } from "@/components/ui/badge";
import { jobStatuses } from "@/lib/constants/jobs";
import { cn } from "@/lib/utils";

const statusClassMap: Record<string, string> = {
  created: "border-border bg-muted text-muted-foreground",
  in_progress:
    "border-blue-400/50 bg-blue-50 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-100",
  finished:
    "border-emerald-400/50 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-50",
  invoiced:
    "border-purple-400/50 bg-purple-50 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/15 dark:text-purple-100",
  on_hold:
    "border-amber-400/50 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-100",
  cancelled:
    "border-red-400/50 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-50",
};

type StatusBadgeProps = {
  status: string;
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const normalizedStatus = status ?? "created";
  const label =
    jobStatuses.find((item) => item.value === normalizedStatus)?.label ??
    normalizedStatus.replace("_", " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium capitalize",
        statusClassMap[normalizedStatus] ?? statusClassMap.created,
      )}
    >
      {label}
    </Badge>
  );
};


