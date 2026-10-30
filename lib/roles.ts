import type { Role } from "@/types";

export const roleHome: Record<Role, string> = {
  talebe: "/",
  camasirci: "/camasirci",
  muhasebeci: "/muhasebeci",
};

export const roleLabel: Record<Role, string> = {
  talebe: "Talebe",
  camasirci: "Çamaşırcı",
  muhasebeci: "Muhasebeci",
};
