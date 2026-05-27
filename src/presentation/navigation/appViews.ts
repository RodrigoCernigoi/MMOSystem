import { Award, BarChart3, CalendarDays, Gift, GitBranch, Home, ListChecks, MoreHorizontal, PlusCircle, Settings, Sparkles, Sun, UserRound } from "lucide-react";
import type { ComponentType } from "react";

export type AppView =
  | "home"
  | "today"
  | "focus"
  | "missions"
  | "calendar"
  | "create"
  | "projects"
  | "skills"
  | "rewards"
  | "reports"
  | "achievements"
  | "status"
  | "settings";

export type NavItem = {
  id: AppView;
  label: string;
  Icon: ComponentType<{ size?: number }>;
};

export const navItems: NavItem[] = [
  { id: "home", label: "Inicio", Icon: Home },
  { id: "today", label: "Hoje", Icon: Sun },
  { id: "missions", label: "Missoes", Icon: ListChecks },
  { id: "calendar", label: "Agenda", Icon: CalendarDays },
  { id: "create", label: "Criar", Icon: PlusCircle },
  { id: "projects", label: "Projetos", Icon: GitBranch },
  { id: "skills", label: "Skills", Icon: Sparkles },
  { id: "rewards", label: "Loja", Icon: Gift },
  { id: "reports", label: "Relatorios", Icon: BarChart3 },
  { id: "achievements", label: "Conquistas", Icon: Award },
  { id: "status", label: "Status", Icon: UserRound },
  { id: "settings", label: "Config", Icon: Settings },
];

export const primaryMobileNavIds: AppView[] = ["home", "today", "missions", "create", "skills"];

export const MoreIcon = MoreHorizontal;
