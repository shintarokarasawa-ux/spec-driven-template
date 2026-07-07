import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTasksQuery } from "../api";
import { applyFilter, TASK_FILTERS, useTaskFilterStore } from "../store";

export function TaskList() {
  // サーバー状態: TanStack Query
  const { data: tasks, isPending, isError } = useTasksQuery();
  // クライアント状態: Zustand
  const filter = useTaskFilterStore((state) => state.filter);
  const setFilter = useTaskFilterStore((state) => state.setFilter);

  if (isPending) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }
  if (isError) {
    return <p className="text-destructive">タスクの取得に失敗しました</p>;
  }

  const visibleTasks = applyFilter(tasks, filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TASK_FILTERS.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {visibleTasks.length === 0 ? (
        <p className="text-muted-foreground">該当するタスクがありません</p>
      ) : (
        <ul className="space-y-2">
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <Card>
                <CardContent className="flex items-center justify-between">
                  <span>{task.title}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      task.status === "done"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {task.status === "done" ? "完了" : "未完了"}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
