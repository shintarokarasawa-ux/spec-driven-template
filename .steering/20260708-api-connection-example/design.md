# 設計書

## アーキテクチャ概要

```
components ──▶ api.ts(Queryフック) ──▶ lib/api-client.ts(fetch) ──▶ HTTP
                    │  Zodでparse                                    │
                    ▼                                                ▼
              タスク追加はuseMutation                    開発/テスト時はMSWが/api/*を
              + invalidateQueries                        インターセプト(handlers.ts)
```

- コンポーネントは従来どおりapi.tsのフックしか知らない(差し替え境界は維持)
- モックの実装場所がqueryFn内 → HTTP層(MSW)に移り、fetch・エラー処理・パースまで
  本番同等のコードパスがテストされる

## コンポーネント設計

### 1. lib/api-client.ts

```ts
export class ApiError extends Error { status: number; ... }

apiFetch(path, init?): Promise<unknown>
  - URL組み立て: VITE_API_BASE_URL(既定 "/api")。相対指定はorigin付与
    (テスト環境のfetchが絶対URLを要求するため)
  - !response.ok → ApiError(status)
  - JSONを返す(検証は呼び出し側のZodが担当)
```

### 2. features/tasks の変更

| ファイル | 変更 |
|---------|------|
| types.ts | Zodスキーマ(taskSchema/taskListSchema)を定義し型をz.inferで導出 |
| api.ts | fetchTasks→apiFetch+parse。useCreateTaskMutation(POST、成功時invalidate)を追加 |
| components/task-form.tsx | 新規: 入力+追加ボタン(shadcn/ui input)。isPending中はdisabled |
| components/tasks-page.tsx | TaskFormを配置 |

### 3. MSW

```
src/mocks/
├── handlers.ts   # GET/POST /api/tasks(モジュール内の配列で状態保持、resetMockTasks()付き)
├── browser.ts    # setupWorker(開発時)
└── server.ts     # setupServer(テスト時)
```

- ハンドラのパスは `*/api/tasks`(ブラウザ/node両対応のワイルドカード)
- main.tsx: `import.meta.env.DEV && VITE_API_MOCK !== "false"` のときのみ
  worker.start()してからrender(実API接続時は`.env.local`でVITE_API_MOCK=false)
- test/setup.ts: server.listen/resetHandlers+resetMockTasks/close のライフサイクル
- `pnpm exec msw init public/` で public/mockServiceWorker.js を生成・コミット

### 4. 依存追加

- dependencies: zod
- devDependencies: msw
- shadcn/ui: input コンポーネントを追加

## エラーハンドリング戦略

- HTTPエラー: ApiError(status)に正規化。Query側はisErrorでUI表示(既存の3状態規約)
- 契約違反(スキーマ不一致): Zodのparseで早期に例外化(黙って壊れたデータを描画しない)

## テスト戦略

- 既存テストをMSW経由に移行(挙動は同じ、レイヤーが深くなる)
- 追加: タスク追加の成功パス(フォーム入力→追加→一覧に反映)
- 追加: APIエラー時の表示(server.useで500を返すハンドラに差し替え)

## 実装の順序

1. 依存導入(zod, msw, shadcn input)+ msw init
2. api-client / Zodスキーマ / api.ts改修
3. MSWハンドラ+main.tsx/テストセットアップ
4. タスク追加フォーム
5. テスト更新・追加 → check/test/build
6. スキル・.env.example・ドキュメント反映
7. コミット・push

## セキュリティ考慮事項

- `VITE_`変数はバンドルに埋め込まれ公開される旨を.env.exampleに明記
- 認証トークン等の秘密はフロントに置かず、必要ならバックエンド側のセッション/BFFで扱う
  (patterns.mdに記述)
