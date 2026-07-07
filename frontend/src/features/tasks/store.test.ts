import { beforeEach, describe, expect, it } from "vitest";
import { applyFilter, useTaskFilterStore } from "./store";
import type { Task } from "./types";

const TASKS: Task[] = [
  { id: "TASK-1", title: "完了済みタスク", status: "done" },
  { id: "TASK-2", title: "未完了タスク", status: "open" },
];

describe("applyFilter", () => {
  it("all は全件を返す", () => {
    expect(applyFilter(TASKS, "all")).toHaveLength(2);
  });

  it("open は未完了のみ返す", () => {
    expect(applyFilter(TASKS, "open").map((task) => task.id)).toEqual(["TASK-2"]);
  });

  it("done は完了のみ返す", () => {
    expect(applyFilter(TASKS, "done").map((task) => task.id)).toEqual(["TASK-1"]);
  });
});

describe("useTaskFilterStore", () => {
  beforeEach(() => {
    useTaskFilterStore.setState({ filter: "all" });
  });

  it("初期値は all", () => {
    expect(useTaskFilterStore.getState().filter).toBe("all");
  });

  it("setFilter で更新できる", () => {
    useTaskFilterStore.getState().setFilter("done");

    expect(useTaskFilterStore.getState().filter).toBe("done");
  });
});
