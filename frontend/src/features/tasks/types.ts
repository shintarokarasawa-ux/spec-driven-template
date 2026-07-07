import { z } from "zod";

// APIレスポンスは信用せず、境界でスキーマ検証してから使う。
// 型はスキーマから導出し、二重定義を避ける
export const taskStatusSchema = z.enum(["open", "done"]);

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
});

export const taskListSchema = z.array(taskSchema);

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
