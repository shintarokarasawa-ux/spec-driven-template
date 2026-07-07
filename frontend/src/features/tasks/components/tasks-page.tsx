import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";

export function TasksPage() {
  return (
    <section className="space-y-6">
      <h1 className="font-bold text-2xl">タスク一覧</h1>
      <TaskForm />
      <TaskList />
    </section>
  );
}
