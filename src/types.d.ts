// Hex color string like #RGB or #RRGGBB. Using a broad template keeps TS fast and friendly.
export type HexColor = `#${string}`;

export type Tag = {
  label: string;
  color: HexColor; // always a valid hex color string
};

export type Task = {
  header: string;
  description?: string;
  tags?: Tag[];
};

export type TaskList = {
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
