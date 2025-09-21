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
  content?: Option<string>;
  tags?: Option<Tag[]>;
  // Estimated time in seconds for completing the task
  estimatedSeconds?: Option<number>;
  // Aggregated time spent in seconds (derived from timeLogs for convenience)
  timeSpentSeconds?: Option<number>;
  // Time logs capturing focus sessions for this task
  timeLogs?: Option<
    {
      start: string; // ISO string
      end?: string; // ISO string
      kind?: "focus" | "pomodoro-work" | "pomodoro-break";
    }[]
  >;
  // Optional per-task Pomodoro configuration
  pomodoro?: Option<{
    workMinutes: number;
    breakMinutes: number;
  }>;
  // Optional scheduled datetime for this task
  scheduledAt?: Option<Date>;
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
  onClick?: () => void;
};
