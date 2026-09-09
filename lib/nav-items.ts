import {
  Home,
  ClipboardList,
  CheckSquare,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Cloud,
  Users,
  Sparkles,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Full desktop sidebar order (spec §42). */
export const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Hausaufgaben", href: "/home/hausaufgaben", icon: ClipboardList },
  { label: "To-Dos", href: "/home/todos", icon: CheckSquare },
  { label: "Stundenplan", href: "/home/stundenplan", icon: CalendarClock },
  { label: "Termine", href: "/home/termine", icon: CalendarDays },
  { label: "Prüfungen", href: "/home/pruefungen", icon: GraduationCap },
  { label: "Fächer", href: "/home/faecher", icon: BookOpen },
  { label: "Cloud", href: "/cloud", icon: Cloud },
  { label: "Klasse", href: "/klasse", icon: Users },
  { label: "KI", href: "/ki", icon: Sparkles },
  { label: "Einstellungen", href: "/einstellungen", icon: Settings },
];

export const ADMIN_NAV_ITEM: NavItem = {
  label: "Administration",
  href: "/admin",
  icon: ShieldCheck,
};

/** Condensed mobile bottom nav (spec §42) — the rest live behind "Mehr". */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aufgaben", href: "/home/hausaufgaben", icon: ClipboardList },
  { label: "Termine", href: "/home/termine", icon: CalendarDays },
  { label: "Cloud", href: "/cloud", icon: Cloud },
  { label: "KI", href: "/ki", icon: Sparkles },
];
