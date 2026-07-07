import { create } from "zustand";
import type { Task, TaskStatus } from "./types";

export type TaskFilter = TaskStatus | "all";

export const TASK_FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "open", label: "未完了" },
  { value: "done", label: "完了" },
];

// クライアント状態(UIの表示条件)はZustand、サーバー状態はTanStack Queryと分離する
interface TaskFilterState {
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
}

export const useTaskFilterStore = create<TaskFilterState>()((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));

export function applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === "all") return tasks;
  return tasks.filter((task) => task.status === filter);
}
