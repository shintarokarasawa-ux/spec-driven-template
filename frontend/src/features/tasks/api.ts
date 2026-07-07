import { useQuery } from "@tanstack/react-query";
import type { Task } from "./types";

// 実プロジェクトではfetch等でAPIを呼ぶ実装に置き換える。
// テンプレートはバックエンド非依存で動くよう、遅延つきモックで代替している。
const MOCK_TASKS: Task[] = [
  { id: "TASK-1", title: "永続ドキュメントを作成する", status: "done" },
  { id: "TASK-2", title: "ステアリングファイルを計画する", status: "open" },
  { id: "TASK-3", title: "サンプル機能を実装する", status: "open" },
];

async function fetchTasks(): Promise<Task[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_TASKS;
}

// クエリキーはスライス内でファクトリとして一元管理する
export const taskKeys = {
  all: ["tasks"] as const,
};

export function useTasksQuery() {
  return useQuery({ queryKey: taskKeys.all, queryFn: fetchTasks });
}
