export const jobStatuses = [
  { value: "created", label: "Created" },
  { value: "in_progress", label: "In progress" },
  { value: "finished", label: "Finished" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
  { value: "on_hold", label: "On hold" },
] as const;

export const serviceTypes = [
  "translation",
  "proofreading",
  "transcreation",
  "LQA",
  "desktop_publishing",
] as const;

export const pricingOptions = [
  { value: "per_word", label: "Per word" },
  { value: "per_hour", label: "Per hour" },
  { value: "flat_fee", label: "Flat fee" },
] as const;

