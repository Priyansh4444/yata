export type Task = {
  header: string;
  tags?: string[];
};

export type TaskList = {
  header: string;
  tasks: Task[];
}

export type MenuItem = {
  icon: JSX.Element;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}