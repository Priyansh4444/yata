import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  createEffect,
} from "solid-js";
import { loadBoard, saveBoard } from "@/libs/storage";
import type { Task, TaskList } from "@/types";
import MiniShell from "@/components/mini/mini-shell";
import MiniPicker from "@/components/mini/mini-picker";
import MiniProgress from "@/components/mini/mini-progress";
import MiniActions, { MiniButton } from "@/components/mini/mini-actions";
import { moveTaskToCompleted } from "@/libs/board";
import type { Item } from "@/components/mini/mini-picker";

type TimerMode = "pomodoro-work" | "pomodoro-break" | "focus";

interface TimerState {
  remaining: number;
  isRunning: boolean;
  mode: TimerMode;
  workMinutes: number;
  breakMinutes: number;
}

type TaskItem = Item;

// Time formatting utilities
const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  TIMER_INTERVAL: 1000,
  DEFAULT_WORK_MINUTES: 25,
  DEFAULT_BREAK_MINUTES: 5,
} as const;

function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (seconds % TIME_CONSTANTS.SECONDS_PER_HOUR) /
      TIME_CONSTANTS.SECONDS_PER_MINUTE,
  );
  const remainingSeconds = seconds % TIME_CONSTANTS.SECONDS_PER_MINUTE;

  return [hours, minutes, remainingSeconds]
    .map((unit) => unit.toString().padStart(2, "0"))
    .join(":");
}

function minutesToSeconds(minutes: number): number {
  return minutes * TIME_CONSTANTS.SECONDS_PER_MINUTE;
}

function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / TIME_CONSTANTS.SECONDS_PER_MINUTE);
}

// Timer management hook
function createTimer() {
  let timerId: ReturnType<typeof setInterval> | null = null;

  const start = (callback: () => void) => {
    if (timerId) return;
    timerId = setInterval(callback, TIME_CONSTANTS.TIMER_INTERVAL);
  };

  const stop = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const cleanup = () => stop();

  return { start, stop, cleanup };
}

// URL parameter utilities
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    taskId: params.get("taskId"),
    mode: params.get("mode") as TimerMode | null,
  };
}

function updateUrlParams(taskId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("taskId", taskId);
  window.history.replaceState({}, "", url);
}

// Task utilities
function findTaskById(lists: TaskList[], taskId: string): Task | null {
  for (const list of lists) {
    const task = list.tasks.find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}

function calculateTimeSpent(timeLogs: Task["timeLogs"]): number {
  if (!timeLogs) return 0;

  return timeLogs.reduce((total, log) => {
    const startTime = new Date(log.start).getTime();
    const endTime = log.end ? new Date(log.end).getTime() : startTime;
    return total + Math.max(0, Math.floor((endTime - startTime) / 1000));
  }, 0);
}

function isValidTimerMode(mode: string | null): mode is TimerMode {
  return (
    mode === "pomodoro-work" || mode === "pomodoro-break" || mode === "focus"
  );
}

export default function TimerPage() {
  const [lists, setLists] = createSignal<TaskList[]>([]);
  const [selectedTask, setSelectedTask] = createSignal<Task | null>(null);

  const [timerState, setTimerState] = createSignal<TimerState>({
    remaining: 0,
    isRunning: false,
    mode: "focus",
    workMinutes: TIME_CONSTANTS.DEFAULT_WORK_MINUTES,
    breakMinutes: TIME_CONSTANTS.DEFAULT_BREAK_MINUTES,
  });

  const timer = createTimer();

  // Computed values
  const allTasks = createMemo((): TaskItem[] => {
    return lists().flatMap((list) =>
      list.tasks
        .filter((task) => !task.isDraft)
        .map((task) => ({
          id: task.id,
          label: task.header || "Untitled",
          meta: list.header,
        })),
    );
  });

  const progressValue = createMemo(() => {
    const task = selectedTask();
    if (!task) return 0;

    const spent = task.timeSpentSeconds || 0;
    const estimated = task.estimatedSeconds || 1;
    return spent / Math.max(1, estimated);
  });

  // Timer control functions
  function startTimer() {
    const state = timerState();
    if (state.isRunning) return;

    setTimerState((prev) => ({ ...prev, isRunning: true }));

    const task = selectedTask();
    if (task) {
      addTimeLog(task, state.mode);
      saveBoard(lists());
    }

    timer.start(() => {
      setTimerState((prev) => {
        const newRemaining = Math.max(0, prev.remaining - 1);

        if (newRemaining === 0) {
          handleTimerComplete();
        }

        return { ...prev, remaining: newRemaining };
      });
    });
  }

  function stopTimer() {
    timer.stop();

    setTimerState((prev) => ({ ...prev, isRunning: false }));

    const task = selectedTask();
    if (task) {
      completeTimeLog(task);
      updateTaskTimeSpent(task);
      saveBoard(lists());
    }
  }

  function handleTimerComplete() {
    const state = timerState();
    const task = selectedTask();

    if (task?.pomodoro) {
      handlePomodoroTransition(state, task);
    } else {
      stopTimer();
    }
  }

  function handlePomodoroTransition(state: TimerState, task: Task) {
    stopTimer();

    if (state.mode === "pomodoro-work") {
      setTimerState((prev) => ({
        ...prev,
        mode: "pomodoro-break",
        remaining: minutesToSeconds(
          task.pomodoro?.breakMinutes || state.breakMinutes,
        ),
      }));
      startTimer();
    } else if (state.mode === "pomodoro-break") {
      setTimerState((prev) => ({
        ...prev,
        mode: "pomodoro-work",
        remaining: minutesToSeconds(
          task.pomodoro?.workMinutes || state.workMinutes,
        ),
      }));
      startTimer();
    }
  }

  // Task time logging
  function addTimeLog(task: Task, mode: TimerMode) {
    if (!task.timeLogs) task.timeLogs = [];
    task.timeLogs.push({
      start: new Date().toISOString(),
      kind: mode,
    });
  }

  function completeTimeLog(task: Task) {
    if (!task.timeLogs || task.timeLogs.length === 0) return;

    const lastLog = task.timeLogs[task.timeLogs.length - 1];
    if (!lastLog.end) {
      lastLog.end = new Date().toISOString();
    }
  }

  function updateTaskTimeSpent(task: Task) {
    task.timeSpentSeconds = calculateTimeSpent(task.timeLogs);
  }

  // Task selection
  function selectTask(taskId: string) {
    const task = findTaskById(lists(), taskId);
    if (!task) return;

    setSelectedTask(task);
    setTimerState((prev) => ({
      ...prev,
      remaining: task.estimatedSeconds || 0,
      workMinutes:
        task.pomodoro?.workMinutes || TIME_CONSTANTS.DEFAULT_WORK_MINUTES,
      breakMinutes:
        task.pomodoro?.breakMinutes || TIME_CONSTANTS.DEFAULT_BREAK_MINUTES,
    }));

    updateUrlParams(taskId);
  }

  function setPomodoroMode() {
    const state = timerState();
    setTimerState((prev) => ({
      ...prev,
      mode: "pomodoro-work",
      remaining: minutesToSeconds(state.workMinutes),
    }));
  }

  async function completeTask() {
    const task = selectedTask();
    if (!task) return;

    const updatedLists = moveTaskToCompleted(lists(), task.id);
    await saveBoard(updatedLists);
    setLists(updatedLists);
    setSelectedTask(null);
  }

  // Initialization
  onMount(async () => {
    const board = await loadBoard();
    if (board) {
      setLists(board);
    }

    const { taskId, mode } = getUrlParams();

    if (isValidTimerMode(mode)) {
      setTimerState((prev) => ({ ...prev, mode }));
    }

    if (taskId) {
      selectTask(taskId);
    }
  });

  // Cleanup
  onCleanup(() => {
    timer.cleanup();
  });

  // Auto-save when task changes
  createEffect(() => {
    const task = selectedTask();
    if (task) {
      saveBoard(lists());
    }
  });

  const state = timerState();
  const task = selectedTask();

  return (
    <MiniShell title="Timer">
      <div class="space-y-3 text-center">
        <MiniPicker
          items={allTasks()}
          value={task?.id ?? null}
          onChange={(id) => id && selectTask(id)}
          placeholder="Search tasks or lists..."
        />

        <Show
          when={task}
          fallback={<div class="text-white/70">No task chosen.</div>}
        >
          <div class="text-xs opacity-90">{task!.header}</div>

          <div class="text-5xl font-mono tracking-widest text-white">
            {formatTime(state.remaining)}
          </div>

          <MiniProgress value={progressValue()} />

          <div class="flex items-center justify-center gap-2 text-xs text-white/80">
            <MiniButton onClick={setPomodoroMode}>Pomodoro</MiniButton>
            <span>
              Work {state.workMinutes}m · Break {state.breakMinutes}m
            </span>
          </div>

          <MiniActions>
            <MiniButton onClick={startTimer} disabled={state.isRunning}>
              Start
            </MiniButton>
            <MiniButton onClick={stopTimer} disabled={!state.isRunning}>
              Stop
            </MiniButton>
            <MiniButton onClick={completeTask}>Move to Completed</MiniButton>
          </MiniActions>

          <div class="text-xs opacity-80">
            Est: {secondsToMinutes(task!.estimatedSeconds || 0)} min · Done:{" "}
            {secondsToMinutes(task!.timeSpentSeconds || 0)} min
          </div>
        </Show>
      </div>
    </MiniShell>
  );
}
