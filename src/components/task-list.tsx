import { TaskList } from "@/types";

export default function TaskListComponent({ tasklist }: { tasklist: TaskList }) {
  const { header, tasks } = tasklist;
  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Task List for {header}</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div class="py-2 bg-gray-800 rounded-lg">
            <div class="flex items-center justify-between px-4">
              <h2 class="text-lg font-semibold text-white">{task.header}</h2>
              {task.tags && task.tags.length > 0 && (
                <div class="flex space-x-2">
                  {task.tags.map((tag) => (
                    <span class="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
