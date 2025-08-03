export type Task = {
  header: string;
  tags?: string[];
};

export type TaskList = {
  header: string;
  tasks: Task[];
}