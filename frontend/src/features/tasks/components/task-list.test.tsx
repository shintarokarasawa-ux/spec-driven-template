import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTaskFilterStore } from "../store";
import { TaskList } from "./task-list";

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("TaskList", () => {
  beforeEach(() => {
    useTaskFilterStore.setState({ filter: "all" });
  });

  it("読み込み後にタスク一覧を表示する", async () => {
    renderWithQueryClient(<TaskList />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    expect(await screen.findByText("サンプル機能を実装する")).toBeInTheDocument();
    expect(screen.getByText("永続ドキュメントを作成する")).toBeInTheDocument();
  });

  it("フィルタで完了タスクのみに絞り込める", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TaskList />);
    await screen.findByText("サンプル機能を実装する");

    await user.click(screen.getByRole("button", { name: "完了" }));

    expect(screen.getByText("永続ドキュメントを作成する")).toBeInTheDocument();
    expect(screen.queryByText("サンプル機能を実装する")).not.toBeInTheDocument();
  });
});
