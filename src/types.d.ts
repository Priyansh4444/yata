// Hex color string like #RGB or #RRGGBB. Using a broad template keeps TS fast and friendly.
export type HexColor = `#${string}`;
type Option<T> = T | undefined;

export type Priority = "low" | "medium" | "high";

export type Tag = {
  label: string;
  color: HexColor; // always a valid hex color string
};

export type Task = {
  header: string;
  id: string;
  isDraft: boolean;
  createdAt: Date;
  dueDate?: Option<Date>;
  completedAt?: Option<Date>;
  priority?: Option<Priority>;
  folder: string;
  content?: Option<string>;
  tags?: Option<Tag[]>;
};

export type TaskList = {
  id: string;
  header: string;
  tasks: Task[];
};

export type MenuItem = {
  icon: JSX.Element;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
};
