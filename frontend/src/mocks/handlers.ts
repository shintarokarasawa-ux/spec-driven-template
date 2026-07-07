import { HttpResponse, http } from "msw";
import type { Task } from "@/features/tasks/types";

// このハンドラ群がAPI契約のドキュメントを兼ねる。
// 実バックエンドを実装する際は、ここで定義したパス・リクエスト/レスポンス形式に合わせる
const INITIAL_TASKS: Task[] = [
  { id: "TASK-1", title: "永続ドキュメントを作成する", status: "done" },
  { id: "TASK-2", title: "ステアリングファイルを計画する", status: "open" },
  { id: "TASK-3", title: "サンプル機能を実装する", status: "open" },
];

let tasks: Task[] = [...INITIAL_TASKS];
let nextId = INITIAL_TASKS.length + 1;

// テストの独立性のため、各テスト後に呼び出して状態を戻す(test/setup.ts参照)
export function resetMockTasks(): void {
  tasks = [...INITIAL_TASKS];
  nextId = INITIAL_TASKS.length + 1;
}

export const handlers = [
  // GET /api/tasks — タスク一覧を返す
  http.get("*/api/tasks", () => HttpResponse.json(tasks)),

  // POST /api/tasks — { title: string } を受け取りTaskを201で返す
  http.post("*/api/tasks", async ({ request }) => {
    const body = (await request.json()) as { title?: string };
    if (!body?.title) {
      return HttpResponse.json({ message: "title is required" }, { status: 400 });
    }

    const task: Task = { id: `TASK-${nextId}`, title: body.title, status: "open" };
    nextId += 1;
    tasks = [...tasks, task];
    return HttpResponse.json(task, { status: 201 });
  }),
];
