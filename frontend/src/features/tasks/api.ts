import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { type Task, taskListSchema, taskSchema } from "./types";

// クエリキーはスライス内でファクトリとして一元管理する
export const taskKeys = {
  all: ["tasks"] as const,
};

// 開発・テスト時は src/mocks/handlers.ts(MSW)が /api/tasks に応答する。
// 実APIへの接続は .env.local の VITE_API_MOCK=false で切り替える
async function fetchTasks(): Promise<Task[]> {
  const payload = await apiFetch("/tasks");
  return taskListSchema.parse(payload);
}

export function useTasksQuery() {
  return useQuery({ queryKey: taskKeys.all, queryFn: fetchTasks });
}

async function createTask(title: string): Promise<Task> {
  const payload = await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return taskSchema.parse(payload);
}

// 更新系の基本形: 成功したら関連クエリをinvalidateして一覧を再取得する
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
