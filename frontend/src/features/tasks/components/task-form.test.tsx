import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { TasksPage } from "./tasks-page";

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("TaskForm", () => {
  it("タスクを追加すると一覧に反映される", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TasksPage />);
    await screen.findByText("サンプル機能を実装する");

    await user.type(screen.getByRole("textbox", { name: "タスク名" }), "APIに接続する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(await screen.findByText("APIに接続する")).toBeInTheDocument();
    // 送信成功後は入力欄がクリアされる
    expect(screen.getByRole("textbox", { name: "タスク名" })).toHaveValue("");
  });

  it("入力が空の間は追加ボタンが無効", async () => {
    renderWithQueryClient(<TasksPage />);
    await screen.findByText("サンプル機能を実装する");

    expect(screen.getByRole("button", { name: "追加" })).toBeDisabled();
  });
});
