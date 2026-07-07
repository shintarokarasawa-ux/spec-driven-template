export type TaskStatus = "open" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}
