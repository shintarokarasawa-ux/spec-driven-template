import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTaskMutation } from "../api";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const createTask = useCreateTaskMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    createTask.mutate(trimmed, {
      onSuccess: () => setTitle(""),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新しいタスクを入力"
          aria-label="タスク名"
        />
        <Button type="submit" disabled={createTask.isPending || title.trim() === ""}>
          {createTask.isPending ? "追加中..." : "追加"}
        </Button>
      </div>
      {createTask.isError && <p className="text-destructive text-sm">タスクの追加に失敗しました</p>}
    </form>
  );
}
