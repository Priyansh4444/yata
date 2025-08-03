import { Task } from "../types";

export default function TaskCard({
  task
}: {
  task: Task;
}) {
  const { header, tags } = task;
  return (
    <div class="py-2 bg-gray-800 rounded-lg">
      <div class="flex items-center justify-between px-4">
        <h2 class="text-lg font-semibold text-white">{header}</h2>
        {tags && tags.length > 0 && (
          <div class="flex space-x-2">
            {tags.map((tag) => (
              <span class="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-300 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div class="px-4 py-2">
        <p class="text-sm text-gray-400">Task description goes here...</p>
      </div>
    </div>
  );
}
