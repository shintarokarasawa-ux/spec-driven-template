# 新規機能スライスの追加手順(定型)

`src/features/tasks/` が参照実装。新機能はこれと同じ形で追加する。
以下は「projects」機能を追加する場合の例。

## 1. スライスの骨組みを作成

```
frontend/src/features/projects/
├── types.ts
├── api.ts
├── store.ts          # クライアント状態が必要な場合のみ
├── routes.tsx
└── components/
    └── projects-page.tsx
```

## 2. 型とデータ取得(types.ts, api.ts)

1. `types.ts` にZodスキーマを定義し、型は`z.infer`で導出
2. `api.ts` にクエリキーファクトリとQuery/Mutationフックを定義
   - HTTPは`apiFetch`(lib/api-client)経由、レスポンスはスキーマで`parse`
   - 更新系は`useMutation` + 成功時`invalidateQueries`(`tasks/api.ts`参照)
3. バックエンドが未実装の間は `src/mocks/handlers.ts` にこの機能のハンドラを追加する
   (ハンドラがAPI契約のドキュメントになる。実API接続時は`.env.local`に
   `VITE_API_MOCK=false`を設定するだけでコード変更不要)

## 3. クライアント状態(store.ts、必要な場合のみ)

- UIの表示条件(フィルタ・選択・開閉)だけをZustandに置く
- 導出ロジックは純粋関数として同ファイルにexport(テスト対象)

## 4. 画面(components/)

- `projects-page.tsx`(ページ)と、部品コンポーネントに分割
- shadcn/uiが必要なら `pnpm dlx shadcn@latest add [component]` で追加
- ローディング・エラー・空の3状態を実装

## 5. ルート登録(routes.tsx → app/router.tsx)

```tsx
// features/projects/routes.tsx
export const projectRoutes: RouteObject[] = [
  { path: "projects", Component: ProjectsPage },
];
```

```tsx
// app/router.tsx(children配列に1行追加)
children: [{ index: true, Component: HomePage }, ...taskRoutes, ...projectRoutes],
```

ナビゲーションに載せる場合は `app/root-layout.tsx` の `NAV_ITEMS` に追加。

## 6. テスト

- `store.test.ts`: 純粋関数とストアの単体テスト
- `components/*.test.tsx`: Testing Libraryによるコンポーネントテスト
  (`tasks/components/task-list.test.tsx` の `renderWithQueryClient` パターンを踏襲)
- 主要導線なら `e2e/` にスモークを1本追加

## 7. 検証

```bash
cd frontend
pnpm check && pnpm test && pnpm build
```

3つすべてパスしたら完了。tasklist.md(ステアリング)の進捗を更新する。
