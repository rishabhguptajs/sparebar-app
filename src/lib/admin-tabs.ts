export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "payments", label: "Payments" },
  { key: "referrals", label: "Referrals" },
  { key: "margins", label: "Margins" },
  { key: "labs", label: "Labs" },
  { key: "credits", label: "Grant credits" },
] as const;
export type AdminTab = (typeof TABS)[number]["key"];

export const parseTab = (raw: string | undefined): AdminTab => TABS.find((t) => t.key === raw)?.key ?? "overview";
