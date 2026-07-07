import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="font-bold text-3xl">スペック駆動開発テンプレート</h1>
      <p className="text-muted-foreground">
        Vite + React + TypeScript のベースラインです。features/ 配下のサンプル機能(tasks)が、
        ルーティング・TanStack Query・Zustand・shadcn/ui の配線例を示します。
      </p>
      <Button asChild>
        <Link to="/tasks">タスク一覧を見る</Link>
      </Button>
    </section>
  );
}
